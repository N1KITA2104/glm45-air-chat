import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { throttleBasic, type BlockMatch, useLLMOutput } from '@llm-ui/react';
import { markdownLookBack } from '@llm-ui/markdown';

type Props = {
  content: string;
};

const MarkdownBlock: React.FC<{ blockMatch: BlockMatch }> = ({ blockMatch }) => (
  <ReactMarkdown remarkPlugins={[remarkGfm]}>{blockMatch.visibleText}</ReactMarkdown>
);

const fallbackBlock = {
  component: MarkdownBlock,
  lookBack: markdownLookBack(),
};

export const LLMMessage: React.FC<Props> = ({ content }) => {
  const { blockMatches } = useLLMOutput({
    llmOutput: content,
    fallbackBlock,
    isStreamFinished: true,
    throttle: useMemo(() => throttleBasic({ readAheadChars: 3 }), []),
  });

  return (
    <div className="message-assistant">
      {blockMatches.map((match, index) => {
        const Component = match.block.component as React.ComponentType<{ blockMatch: BlockMatch }>;
        return <Component key={`${match.startIndex}-${index}`} blockMatch={match} />;
      })}
    </div>
  );
};

