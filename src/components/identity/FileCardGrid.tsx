import { useState } from 'react';
import { FileCard } from './FileCard';
import { FileEditorModal } from './FileEditorModal';
import { FILE_DEFINITIONS, FileDefinition, useIdentityFiles } from '@/hooks/useIdentityFiles';

interface FileCardGridProps {
  agentId?: string;
  agentName?: string;
}

export const FileCardGrid = ({ agentId, agentName }: FileCardGridProps) => {
  const { data: files = [] } = useIdentityFiles(agentId);
  const [selectedFile, setSelectedFile] = useState<FileDefinition | null>(null);

  const getFileForKey = (key: string) => files.find(f => f.file_key === key);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {FILE_DEFINITIONS.map((def) => (
          <FileCard
            key={def.key}
            definition={def}
            file={getFileForKey(def.key)}
            onClick={() => setSelectedFile(def)}
            agentName={agentName}
          />
        ))}
      </div>

      <FileEditorModal
        open={!!selectedFile}
        onOpenChange={(open) => !open && setSelectedFile(null)}
        definition={selectedFile}
        file={selectedFile ? getFileForKey(selectedFile.key) : undefined}
        agentName={agentName}
        agentId={agentId}
      />
    </>
  );
};
