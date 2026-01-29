import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GenerateContentParams {
  topicId: string;
  topicTitle: string;
  topicDescription?: string;
  subjectName?: string;
}

interface GenerateContentResult {
  transcript: string;
  flashSummary: {
    id: string;
    topic_id: string;
    visual_type: string;
    visual_content: string;
    bullet_points: string[];
    difficulty: string;
    ai_generated: boolean;
  };
}

export const useGenerateContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: GenerateContentParams): Promise<GenerateContentResult> => {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: params,
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate content');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return {
        transcript: data.transcript,
        flashSummary: data.flashSummary,
      };
    },
    onSuccess: () => {
      // Invalidate topics query to refresh with new content
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['topic'] });
      toast.success('Content generated!', {
        description: 'AI has created the transcript and flash summary.',
      });
    },
    onError: (error: Error) => {
      console.error('Generate content error:', error);
      toast.error('Failed to generate content', {
        description: error.message,
      });
    },
  });
};

// Keep these for backwards compatibility but they now just call the unified function
export const useGenerateSummary = () => {
  return useGenerateContent();
};

export const useGenerateTranscript = () => {
  return useGenerateContent();
};
