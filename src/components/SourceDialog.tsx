import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { ChevronDown, ChevronRight, Search } from "lucide-react";

interface SourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Schema {
  name: string;
  tables: string[];
}

interface SelectedItems {
  [schemaName: string]: string[];
}

export function SourceDialog({ open, onOpenChange }: SourceDialogProps) {
  const [connected, setConnected] = useState(false);
  const [connectionData, setConnectionData] = useState({
    host: '',
    port: '5432',
    database: '',
    user: '',
    password: '',
    ssl: false
  });

  const [selectedItems, setSelectedItems] = useState<SelectedItems>({});
  const [expandedSchemas, setExpandedSchemas] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock schema and table data
  const mockSchemas: Schema[] = [
    {
      name: 'public',
      tables: ['users', 'orders', 'products', 'categories', 'reviews']
    },
    {
      name: 'analytics',
      tables: ['events', 'sessions', 'user_behavior', 'conversions']
    },
    {
      name: 'inventory',
      tables: ['stock', 'warehouses', 'suppliers', 'shipments']
    },
    {
      name: 'finance',
      tables: ['transactions', 'invoices', 'payments', 'refunds']
    }
  ];

  // Filter schemas and tables based on search query
  const filteredSchemas = mockSchemas.map(schema => ({
    ...schema,
    tables: schema.tables.filter(table => 
      schema.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(schema => 
    schema.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    schema.tables.length > 0
  );

  const handleConnect = () => {
    setConnected(true);
    // Auto-expand first schema for better UX
    setExpandedSchemas(['public']);
  };

  const handleBuildContext = () => {
    console.log('Building context with selected items:', selectedItems);
    onOpenChange(false);
  };

  const toggleSchema = (schemaName: string) => {
    setExpandedSchemas(prev => 
      prev.includes(schemaName)
        ? prev.filter(s => s !== schemaName)
        : [...prev, schemaName]
    );
  };

  const toggleTable = (schemaName: string, tableName: string) => {
    setSelectedItems(prev => {
      const schemaItems = prev[schemaName] || [];
      const newSchemaItems = schemaItems.includes(tableName)
        ? schemaItems.filter(t => t !== tableName)
        : [...schemaItems, tableName];
      
      return {
        ...prev,
        [schemaName]: newSchemaItems
      };
    });
  };

  const isTableSelected = (schemaName: string, tableName: string) => {
    return selectedItems[schemaName]?.includes(tableName) || false;
  };

  const getSelectedCount = () => {
    return Object.values(selectedItems).reduce((total, tables) => total + tables.length, 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl h-[80vh]"
        style={{ backgroundColor: 'var(--card)' }}
      >
        <DialogHeader>
          <DialogTitle
            style={{
              fontFamily: 'var(--font-family-serif)',
              fontSize: 'var(--text-xl)',
              fontWeight: 'var(--font-weight-normal)',
              color: 'var(--card-foreground)'
            }}
          >
            Connect to RDS
          </DialogTitle>
          <DialogDescription
            style={{
              fontFamily: 'var(--font-family-sans)',
              fontSize: 'var(--text-sm)',
              color: 'var(--muted-foreground)'
            }}
          >
            Enter your database connection details and select the schemas and tables you want to include.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex h-full gap-6">
          {/* Left Panel - Connection Form */}
          <div className="flex-1 space-y-4">
            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-family-sans)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--card-foreground)',
                  marginBottom: '16px'
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
                      onChange={(e) => setConnectionData(prev => ({ ...prev, host: e.target.value }))}
                      placeholder="localhost"
                      style={{ borderRadius: 'var(--radius-input)' }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="port">Port</Label>
                    <Input
                      id="port"
                      value={connectionData.port}
                      onChange={(e) => setConnectionData(prev => ({ ...prev, port: e.target.value }))}
                      placeholder="5432"
                      style={{ borderRadius: 'var(--radius-input)' }}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="database">Database</Label>
                  <Input
                    id="database"
                    value={connectionData.database}
                    onChange={(e) => setConnectionData(prev => ({ ...prev, database: e.target.value }))}
                    placeholder="mydatabase"
                    style={{ borderRadius: 'var(--radius-input)' }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="user">User</Label>
                  <Input
                    id="user"
                    value={connectionData.user}
                    onChange={(e) => setConnectionData(prev => ({ ...prev, user: e.target.value }))}
                    placeholder="username"
                    style={{ borderRadius: 'var(--radius-input)' }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={connectionData.password}
                    onChange={(e) => setConnectionData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="password"
                    style={{ borderRadius: 'var(--radius-input)' }}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ssl"
                    checked={connectionData.ssl}
                    onCheckedChange={(checked) => setConnectionData(prev => ({ ...prev, ssl: checked as boolean }))}
                  />
                  <Label htmlFor="ssl">SSL</Label>
                </div>
                
                <Button 
                  onClick={handleConnect} 
                  disabled={connected}
                  className="w-full"
                  style={{ borderRadius: 'var(--radius-button)' }}
                >
                  {connected ? 'Connected' : 'Connect'}
                </Button>
              </div>
            </div>
          </div>

          {/* Vertical Divider */}
          <Separator orientation="vertical" className="h-full" />

          {/* Right Panel - Schema/Table Selection */}
          <div className="flex-1 space-y-4">
            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-family-sans)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: connected ? 'var(--card-foreground)' : 'var(--muted-foreground)',
                  marginBottom: '16px'
                }}
              >
                Schema & Table Selection
                {connected && getSelectedCount() > 0 && (
                  <span
                    style={{
                      marginLeft: '8px',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--accent)'
                    }}
                  >
                    ({getSelectedCount()} selected)
                  </span>
                )}
              </h3>
              
              {connected ? (
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search 
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                      style={{ color: 'var(--muted-foreground)' }}
                    />
                    <Input
                      placeholder="Search schemas and tables..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      style={{ borderRadius: 'var(--radius-input)' }}
                    />
                  </div>

                  {/* Schema Tree */}
                  <ScrollArea className="flex-1 h-[400px]">
                    <div className="space-y-2">
                      {filteredSchemas.map((schema) => (
                        <div key={schema.name} className="space-y-1">
                          {/* Schema Header */}
                          <div
                            className="flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-muted/50"
                            onClick={() => toggleSchema(schema.name)}
                            style={{ borderRadius: 'var(--radius)' }}
                          >
                            {expandedSchemas.includes(schema.name) ? (
                              <ChevronDown className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                            ) : (
                              <ChevronRight className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                            )}
                            <span
                              style={{
                                fontFamily: 'var(--font-family-sans)',
                                fontSize: 'var(--text-sm)',
                                fontWeight: 'var(--font-weight-medium)',
                                color: 'var(--card-foreground)'
                              }}
                            >
                              {schema.name}
                            </span>
                            <span
                              style={{
                                fontSize: 'var(--text-xs)',
                                color: 'var(--muted-foreground)'
                              }}
                            >
                              ({schema.tables.length} tables)
                            </span>
                          </div>

                          {/* Schema Tables */}
                          {expandedSchemas.includes(schema.name) && (
                            <div className="ml-6 space-y-1">
                              {schema.tables.map((table) => (
                                <div
                                  key={`${schema.name}.${table}`}
                                  className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors ${
                                    isTableSelected(schema.name, table) 
                                      ? 'bg-accent/10' 
                                      : 'hover:bg-muted/30'
                                  }`}
                                  onClick={() => toggleTable(schema.name, table)}
                                  style={{ borderRadius: 'var(--radius)' }}
                                >
                                  <Checkbox
                                    checked={isTableSelected(schema.name, table)}
                                    onCheckedChange={() => toggleTable(schema.name, table)}
                                  />
                                  <span
                                    style={{
                                      fontFamily: 'var(--font-family-sans)',
                                      fontSize: 'var(--text-sm)',
                                      color: isTableSelected(schema.name, table) 
                                        ? 'var(--accent)' 
                                        : 'var(--card-foreground)'
                                    }}
                                  >
                                    {table}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <div 
                  className="flex items-center justify-center h-[400px] text-center"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  <p style={{ fontSize: 'var(--text-sm)' }}>
                    Connect to your database to view schemas and tables
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div>
            {connected && getSelectedCount() > 0 && (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>
                {getSelectedCount()} table{getSelectedCount() !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              style={{ borderRadius: 'var(--radius-button)' }}
            >
              Close
            </Button>
            <Button 
              onClick={handleBuildContext}
              disabled={!connected || getSelectedCount() === 0}
              style={{ borderRadius: 'var(--radius-button)' }}
            >
              Build Context
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}