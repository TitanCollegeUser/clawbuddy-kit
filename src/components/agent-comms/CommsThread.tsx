import { motion, AnimatePresence } from 'framer-motion';
import { CommsMessage } from './CommsMessage';
import type { AgentComm } from '@/types/command-center';

export interface CommsThreadProps {
  thread: AgentComm;
}

export function CommsThread({ thread }: CommsThreadProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-2"
    >
      <CommsMessage message={thread} />
      <AnimatePresence>
        {thread.replies?.map((reply) => (
          <motion.div
            key={reply.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <CommsMessage message={reply} isReply />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
