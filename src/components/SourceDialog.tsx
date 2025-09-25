import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { ChevronDown, ChevronRight, Search } from "lucide-react";

type SourceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type SelectedItems = Record<string, string[]>;

type SchemaState = {
  name: string;
  tables: string[];
  loaded: boolean;
  loading: boolean;
  error?: string | null;
};

type DisplaySchema = SchemaState & { visibleTables: string[] };

const API_BASE_PATH = "/api/sources";

async function readJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

export function SourceDialog({ open, onOpenChange }: SourceDialogProps) {
  const [connectionData, setConnectionData] = useState({
    host: "",
    port: "5432",
    database: "",
    user: "",
    password: "",
    ssl: false,
  });
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [schemas, setSchemas] = useState<SchemaState[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItems>({});
  const [expandedSchemas, setExpandedSchemas] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [connectError, setConnectError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFetchingSchemas, setIsFetchingSchemas] = useState(false);

  const displaySchemas = useMemo<DisplaySchema[]>(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return schemas.map((schema) => ({ ...schema, visibleTables: schema.tables }));
    }

    return schemas
      .map((schema): DisplaySchema | null => {
        const matchesSchema = schema.name.toLowerCase().includes(query);
        const visibleTables = matchesSchema || !schema.loaded
          ? schema.tables
          : schema.tables.filter((table) => table.toLowerCase().includes(query));

        const shouldInclude = matchesSchema || visibleTables.length > 0;

        if (!shouldInclude) {
          return null;
        }

        return { ...schema, visibleTables };
      })
      .filter((schema): schema is DisplaySchema => schema !== null);
  }, [schemas, searchQuery]);

  const resetMetadataState = () => {
    setSchemas([]);
    setSelectedItems({});
    setExpandedSchemas([]);
  };

  const loadTables = async (schemaName: string, overrideConnectionId?: string) => {
    const activeConnectionId = overrideConnectionId ?? connectionId;
    if (!activeConnectionId) {
      return;
    }

    setSchemas((prevSchemas) =>
      prevSchemas.map((schema) =>
        schema.name === schemaName
          ? { ...schema, loading: true, error: null }
          : schema,
      ),
    );

    try {
      const response = await fetch(
        `${API_BASE_PATH}/tables?connectionId=${encodeURIComponent(activeConnectionId)}&schema=${encodeURIComponent(schemaName)}`,
      );
      const body = await readJson(response);

      if (!response.ok) {
        const message = body?.error ?? "Unable to load tables for the selected schema.";
        throw new Error(message);
      }

      const tables = Array.isArray(body?.tables) ? body.tables : [];

      setSchemas((prevSchemas) =>
        prevSchemas.map((schema) =>
          schema.name === schemaName
            ? { ...schema, tables, loaded: true, loading: false, error: null }
            : schema,
        ),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error while loading tables.";
      setSchemas((prevSchemas) =>
        prevSchemas.map((schema) =>
          schema.name === schemaName
            ? { ...schema, loading: false, error: message }
            : schema,
        ),
      );
    }
  };

  const loadSchemasForConnection = async (activeConnectionId: string) => {
    setIsFetchingSchemas(true);
    setConnectError(null);
    setSelectedItems({});
    setExpandedSchemas([]);

    try {
      const response = await fetch(
        `${API_BASE_PATH}/schemas?connectionId=${encodeURIComponent(activeConnectionId)}`,
      );
      const body = await readJson(response);

      if (!response.ok) {
        const message = body?.error ?? "Unable to load schemas for this connection.";
        throw new Error(message);
      }

      const schemaNames: string[] = Array.isArray(body?.schemas) ? body.schemas : [];
      const nextSchemas: SchemaState[] = schemaNames.map((name) => ({
        name,
        tables: [],
        loaded: false,
        loading: false,
        error: null,
      }));

      setSchemas(nextSchemas);
      setConnected(true);

      if (nextSchemas.length > 0) {
        const firstSchema = nextSchemas[0].name;
        setExpandedSchemas([firstSchema]);
        await loadTables(firstSchema, activeConnectionId);
      }
    } finally {
      setIsFetchingSchemas(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setConnectError(null);
    resetMetadataState();

    try {
      const response = await fetch(`${API_BASE_PATH}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(connectionData),
      });

      const body = await readJson(response);

      if (!response.ok) {
        const message = body?.error ?? "Unable to connect to the database.";
        throw new Error(message);
      }

      if (!body?.connectionId) {
        throw new Error("The backend response did not include a connection identifier.");
      }

      setConnectionId(body.connectionId);
      await loadSchemasForConnection(body.connectionId);
    } catch (error) {
      setConnected(false);
      setConnectionId(null);
      setSchemas([]);
      const message = error instanceof Error ? error.message : "Unexpected error while connecting.";
      setConnectError(message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleBuildContext = () => {
    onOpenChange(false);
  };

  const toggleSchema = (schemaName: string) => {
    setExpandedSchemas((prev) => {
      const isExpanded = prev.includes(schemaName);
      const next = isExpanded ? prev.filter((name) => name !== schemaName) : [...prev, schemaName];

      if (!isExpanded) {
        const target = schemas.find((schema) => schema.name === schemaName);
        if (target && !target.loaded && !target.loading) {
          void loadTables(schemaName);
        }
      }

      return next;
    });
  };

  const toggleTable = (schemaName: string, tableName: string) => {
    setSelectedItems((prev) => {
      const schemaItems = prev[schemaName] ?? [];
      const nextSchemaItems = schemaItems.includes(tableName)
        ? schemaItems.filter((table) => table !== tableName)
        : [...schemaItems, tableName];

      return {
        ...prev,
        [schemaName]: nextSchemaItems,
      };
    });
  };

  const isTableSelected = (schemaName: string, tableName: string) => {
    return selectedItems[schemaName]?.includes(tableName) ?? false;
  };

  const getSelectedCount = () => {
    return Object.values(selectedItems).reduce((total, tables) => total + tables.length, 0);
  };

  const disableBuildContext = !connected || getSelectedCount() === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh]" style={{ backgroundColor: "var(--card)" }}>
        <DialogHeader>
          <DialogTitle
            style={{
              fontFamily: "var(--font-family-serif)",
              fontSize: "var(--text-xl)",
              fontWeight: "var(--font-weight-normal)",
              color: "var(--card-foreground)",
            }}
          >
            Connect to RDS
          </DialogTitle>
          <DialogDescription
            style={{
              fontFamily: "var(--font-family-sans)",
              fontSize: "var(--text-sm)",
              color: "var(--muted-foreground)",
            }}
          >
            Enter your database connection details and select the schemas and tables you want to include.
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-full gap-6">
          <div className="flex-1 space-y-4">
            <div>
              <h3
                style={{
                  fontFamily: "var(--font-family-sans)",
                  fontSize: "var(--text-base)",
                  fontWeight: "var(--font-weight-medium)",
                  color: "var(--card-foreground)",
                  marginBottom: "16px",
                }}
              >
                Database Connection
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="host">Host</Label>
                    <Input
                      id="host"
                      value={connectionData.host}
                      onChange={(event) =>
                        setConnectionData((prev) => ({ ...prev, host: event.target.value }))
                      }
                      placeholder="database.example.com"
                      style={{ borderRadius: "var(--radius-input)" }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="port">Port</Label>
                    <Input
                      id="port"
                      value={connectionData.port}
                      onChange={(event) =>
                        setConnectionData((prev) => ({ ...prev, port: event.target.value }))
                      }
                      placeholder="5432"
                      style={{ borderRadius: "var(--radius-input)" }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="database">Database</Label>
                  <Input
                    id="database"
                    value={connectionData.database}
                    onChange={(event) =>
                      setConnectionData((prev) => ({ ...prev, database: event.target.value }))
                    }
                    placeholder="mydatabase"
                    style={{ borderRadius: "var(--radius-input)" }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user">User</Label>
                  <Input
                    id="user"
                    value={connectionData.user}
                    onChange={(event) =>
                      setConnectionData((prev) => ({ ...prev, user: event.target.value }))
                    }
                    placeholder="username"
                    style={{ borderRadius: "var(--radius-input)" }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={connectionData.password}
                    onChange={(event) =>
                      setConnectionData((prev) => ({ ...prev, password: event.target.value }))
                    }
                    placeholder="••••••••"
                    style={{ borderRadius: "var(--radius-input)" }}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ssl"
                    checked={connectionData.ssl}
                    onCheckedChange={(checked) =>
                      setConnectionData((prev) => ({ ...prev, ssl: Boolean(checked) }))
                    }
                  />
                  <Label htmlFor="ssl">Require SSL</Label>
                </div>

                {connectError ? (
                  <p className="text-sm text-red-500" role="alert">
                    {connectError}
                  </p>
                ) : connected ? (
                  <p className="text-sm text-emerald-500">Connected successfully.</p>
                ) : null}
              </div>
            </div>

            <Button onClick={handleConnect} disabled={isConnecting} className="w-full">
              {isConnecting ? "Connecting…" : "Connect"}
            </Button>
          </div>

          <Separator orientation="vertical" className="h-full" />

          <div className="flex-[1.5] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3
                style={{
                  fontFamily: "var(--font-family-sans)",
                  fontSize: "var(--text-base)",
                  fontWeight: "var(--font-weight-medium)",
                  color: "var(--card-foreground)",
                }}
              >
                Schemas &amp; Tables
              </h3>

              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search schemas or tables"
                  className="pl-9"
                  style={{ borderRadius: "var(--radius-input)" }}
                  disabled={!connected}
                />
              </div>
            </div>

            <div className="border rounded-lg flex-1" style={{ borderColor: "var(--border)" }}>
              <ScrollArea className="h-full p-4">
                {!connected && !isFetchingSchemas ? (
                  <p className="text-sm text-muted-foreground">
                    Enter your connection details and click Connect to browse schemas.
                  </p>
                ) : isFetchingSchemas ? (
                  <p className="text-sm text-muted-foreground">Loading schemas…</p>
                ) : displaySchemas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No schemas match your current search.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {displaySchemas.map((schema) => {
                      const isExpanded = expandedSchemas.includes(schema.name);
                      const hasTables = schema.visibleTables.length > 0;

                      return (
                        <div key={schema.name}>
                          <button
                            type="button"
                            onClick={() => toggleSchema(schema.name)}
                            className="flex items-center justify-between w-full text-left"
                            style={{
                              fontFamily: "var(--font-family-sans)",
                              fontSize: "var(--text-sm)",
                              color: "var(--card-foreground)",
                            }}
                          >
                            <span className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              {schema.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {schema.tables.length} tables
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="ml-6 mt-2 space-y-2">
                              {schema.loading ? (
                                <p className="text-sm text-muted-foreground">Loading tables…</p>
                              ) : schema.error ? (
                                <p className="text-sm text-red-500" role="alert">
                                  {schema.error}
                                </p>
                              ) : schema.loaded && !hasTables ? (
                                <p className="text-sm text-muted-foreground">No tables available.</p>
                              ) : (
                                schema.visibleTables.map((table) => (
                                  <label key={table} className="flex items-center gap-2">
                                    <Checkbox
                                      checked={isTableSelected(schema.name, table)}
                                      onCheckedChange={() => toggleTable(schema.name, table)}
                                    />
                                    <span className="text-sm" style={{ color: "var(--card-foreground)" }}>
                                      {table}
                                    </span>
                                  </label>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>

            <div className="flex items-center justify-between pt-4">
              <span className="text-sm text-muted-foreground">
                {getSelectedCount()} table{getSelectedCount() === 1 ? "" : "s"} selected
              </span>
              <Button onClick={handleBuildContext} disabled={disableBuildContext}>
                Build Context
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
