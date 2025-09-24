import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

interface ContextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultYaml = `# Database Context Configuration
database:
  name: "mydatabase"
  host: "localhost"
  port: 5432
  
schemas:
  - name: "public"
    tables:
      - name: "users"
        columns:
          - name: "id"
            type: "integer"
            primary_key: true
          - name: "email"
            type: "varchar"
          - name: "created_at"
            type: "timestamp"
      - name: "orders"
        columns:
          - name: "id"
            type: "integer"
            primary_key: true
          - name: "user_id"
            type: "integer"
            foreign_key: "users.id"
          - name: "total"
            type: "decimal"
          - name: "status"
            type: "varchar"
            
  - name: "analytics"
    tables:
      - name: "events"
        columns:
          - name: "id"
            type: "uuid"
            primary_key: true
          - name: "event_type"
            type: "varchar"
          - name: "user_id"
            type: "integer"
          - name: "timestamp"
            type: "timestamp"`;

export function ContextDialog({ open, onOpenChange }: ContextDialogProps) {
  const [yamlContent, setYamlContent] = useState(defaultYaml);

  const handleSave = () => {
    console.log('Saving YAML context:', yamlContent);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Context (YAML)</DialogTitle>
          <DialogDescription>
            View and edit the database context configuration in YAML format.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Textarea
            value={yamlContent}
            onChange={(e) => setYamlContent(e.target.value)}
            className="min-h-[400px] font-mono text-sm"
            placeholder="Enter YAML context..."
          />
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}