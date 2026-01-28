import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GenerateSummaryParams {
  topicId: string;
  topicTitle: string;
  topicDescription?: string;
  subjectName?: string;
}

interface GenerateTranscriptParams {
  topicId: string;
  topicTitle: string;
  topicDescription?: string;
  subjectName?: string;
  bulletPoints?: string[];
}

interface FlashSummaryResult {
  id: string;
  topic_id: string;
  visual_type: string;
  visual_content: string;
  bullet_points: string[];
  difficulty: string;
  ai_generated: boolean;
}

export const useGenerateSummary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: GenerateSummaryParams): Promise<FlashSummaryResult> => {
      const { data, error } = await supabase.functions.invoke('generate-summary', {
        body: params,
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate summary');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data.flashSummary;
    },
    onSuccess: () => {
      // Invalidate topics query to refresh flash summaries
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      toast.success('Flash summary generated!', {
        description: 'AI has created a new flash card for this topic.',
      });
    },
    onError: (error: Error) => {
      console.error('Generate summary error:', error);
      toast.error('Failed to generate summary', {
        description: error.message,
      });
    },
  });
};

export const useGenerateTranscript = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: GenerateTranscriptParams): Promise<string> => {
      const { data, error } = await supabase.functions.invoke('generate-transcript', {
        body: params,
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate transcript');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data.transcript;
    },
    onSuccess: () => {
      // Invalidate topics query to refresh descriptions
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      toast.success('Audio transcript generated!', {
        description: 'AI has created a spoken explanation for this topic.',
      });
    },
    onError: (error: Error) => {
      console.error('Generate transcript error:', error);
      toast.error('Failed to generate transcript', {
        description: error.message,
      });
    },
  });
};

export const useGenerateAllContent = () => {
  const generateSummary = useGenerateSummary();
  const generateTranscript = useGenerateTranscript();

  return useMutation({
    mutationFn: async (params: GenerateSummaryParams & { bulletPoints?: string[] }) => {
      // Generate summary first
      const summary = await generateSummary.mutateAsync(params);
      
      // Then generate transcript using the bullet points from the summary
      const transcript = await generateTranscript.mutateAsync({
        ...params,
        bulletPoints: summary.bullet_points,
      });

      return { summary, transcript };
    },
    onSuccess: () => {
      toast.success('AI content generated!', {
        description: 'Both flash summary and audio transcript are ready.',
      });
    },
    onError: (error: Error) => {
      console.error('Generate all content error:', error);
      // Individual mutations already show their own errors
    },
  });
};
