import type { OpsBlock } from '@/hooks/useOpsBlocks';
import { ResearchSettingsBlock } from './ResearchSettingsBlock';
import { ResearchCalendarBlock } from './ResearchCalendarBlock';
import { ResearchResultsBlock } from './ResearchResultsBlock';

const SETTINGS_BLOCK_ID = 'c5ba5149-1258-4aa2-9eb8-dfa4d566fc37';
const CALENDAR_BLOCK_ID = 'a139869e-6e11-43a2-9ffa-0af736b7cfde';
const RESEARCH_BLOCK_ID = 'fb8e532a-f343-4bcc-b4d1-79ba29ca240e';

interface Props {
  block: OpsBlock;
  appId: string;
}

export const ResearchHubBlock = ({ block, appId }: Props) => {
  switch (block.id) {
    case SETTINGS_BLOCK_ID:
      return <ResearchSettingsBlock block={block} appId={appId} />;
    case CALENDAR_BLOCK_ID:
      return <ResearchCalendarBlock block={block} appId={appId} />;
    case RESEARCH_BLOCK_ID:
      return <ResearchResultsBlock block={block} appId={appId} />;
    default:
      return (
        <div className="glass rounded-xl p-6 text-center">
          <p className="text-base text-muted-foreground">Unknown Research Hub block</p>
        </div>
      );
  }
};
