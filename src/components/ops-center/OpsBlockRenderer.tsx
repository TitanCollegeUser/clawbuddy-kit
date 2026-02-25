import type { OpsBlock } from '@/hooks/useOpsBlocks';
import { OpsKanbanBlock } from './blocks/OpsKanbanBlock';
import { OpsTableBlock } from './blocks/OpsTableBlock';
import { OpsMetricCardsBlock } from './blocks/OpsMetricCardsBlock';
import { OpsProgressBarBlock } from './blocks/OpsProgressBarBlock';
import { OpsListBlock } from './blocks/OpsListBlock';
import { OpsChartBlock } from './blocks/OpsChartBlock';
import { OpsTextBlock } from './blocks/OpsTextBlock';
import { OpsFeedBlock } from './blocks/OpsFeedBlock';
import { OpsFormBlock } from './blocks/OpsFormBlock';
import { OpsEmbedBlock } from './blocks/OpsEmbedBlock';
import { OpsTimelineBlock } from './blocks/OpsTimelineBlock';
import { OpsAlertBannerBlock } from './blocks/OpsAlertBannerBlock';
import { OpsCountdownBlock } from './blocks/OpsCountdownBlock';
import { OpsAgentCardBlock } from './blocks/OpsAgentCardBlock';
import { OpsCalendarBlock } from './blocks/OpsCalendarBlock';
import { OpsGalleryBlock } from './blocks/OpsGalleryBlock';
import { OpsApprovalQueueBlock } from './blocks/OpsApprovalQueueBlock';
import { OpsComparisonBlock } from './blocks/OpsComparisonBlock';
import { OpsOutreachScoreboardBlock } from './blocks/OpsOutreachScoreboardBlock';
import { OpsOutreachLeadsBlock } from './blocks/OpsOutreachLeadsBlock';
import { OpsOutreachPhoneBlock } from './blocks/OpsOutreachPhoneBlock';
import { OpsOutreachEmailBlock } from './blocks/OpsOutreachEmailBlock';
import { OpsOutreachCampaignsBlock } from './blocks/OpsOutreachCampaignsBlock';
import { OpsOutreachResultsBlock } from './blocks/OpsOutreachResultsBlock';
import { OpsBlockWrapper } from './blocks/OpsBlockWrapper';
import { ResearchHubBlock } from './research-hub/ResearchHubBlock';

const RESEARCH_HUB_APP_ID = '6149611f-1c3b-4906-9c5b-1fa58d0cd7ce';

interface Props {
  block: OpsBlock;
  appId: string;
}

const renderBlock = (block: OpsBlock, appId: string) => {
  const props = { block, appId };

  // Research Hub custom rendering
  if (appId === RESEARCH_HUB_APP_ID) {
    return <ResearchHubBlock block={block} appId={appId} />;
  }

  switch (block.block_type) {
    case 'kanban': return <OpsKanbanBlock {...props} />;
    case 'table': return <OpsTableBlock {...props} />;
    case 'metric_cards': return <OpsMetricCardsBlock {...props} />;
    case 'progress_bar': return <OpsProgressBarBlock {...props} />;
    case 'list': return <OpsListBlock {...props} />;
    case 'chart': return <OpsChartBlock {...props} />;
    case 'text': return <OpsTextBlock {...props} />;
    case 'feed': return <OpsFeedBlock {...props} />;
    case 'form': return <OpsFormBlock {...props} />;
    case 'embed': return <OpsEmbedBlock {...props} />;
    case 'timeline': return <OpsTimelineBlock {...props} />;
    case 'alert_banner': return <OpsAlertBannerBlock {...props} />;
    case 'countdown': return <OpsCountdownBlock {...props} />;
    case 'agent_card': return <OpsAgentCardBlock {...props} />;
    case 'calendar': return <OpsCalendarBlock {...props} />;
    case 'gallery': return <OpsGalleryBlock {...props} />;
    case 'approval_queue': return <OpsApprovalQueueBlock {...props} />;
    case 'comparison': return <OpsComparisonBlock {...props} />;
    // yt_* block types available via Creator Command Centre module
    case 'outreach_scoreboard': return <OpsOutreachScoreboardBlock {...props} />;
    case 'outreach_leads': return <OpsOutreachLeadsBlock {...props} />;
    case 'outreach_phone': return <OpsOutreachPhoneBlock {...props} />;
    case 'outreach_email': return <OpsOutreachEmailBlock {...props} />;
    case 'outreach_campaigns': return <OpsOutreachCampaignsBlock {...props} />;
    case 'outreach_results': return <OpsOutreachResultsBlock {...props} />;
    // meeting_intel block type available via Meeting Intelligence Engine module
    case 'office':
      return (
        <div className="glass rounded-xl p-6 text-center">
          <p className="text-base text-muted-foreground">Office block — coming soon</p>
        </div>
      );
    default:
      return (
        <div className="glass rounded-xl p-4">
          <p className="text-base text-muted-foreground">Unknown block type: {block.block_type}</p>
        </div>
      );
  }
};

export const OpsBlockRenderer = ({ block, appId }: Props) => {
  return (
    <OpsBlockWrapper block={block} appId={appId}>
      {renderBlock(block, appId)}
    </OpsBlockWrapper>
  );
};
