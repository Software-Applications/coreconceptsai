import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface TopicRequestParams {
  query: string;
  subjectId?: string;
}

export const useTopicRequest = () => {
  return useMutation({
    mutationFn: async ({ query, subjectId }: TopicRequestParams) => {
      // Get current user if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('topic_requests')
        .insert({
          query: query.trim(),
          subject_id: subjectId || null,
          user_id: user?.id || null,
        });

      if (error) throw error;
      return { success: true };
    },
    onSuccess: (_, variables) => {
      const displayQuery = variables.query.length > 30 
        ? `${variables.query.slice(0, 30)}...` 
        : variables.query;
      
      toast({
        title: "Topic requested!",
        description: `We'll review "${displayQuery}" for future content.`,
      });
    },
    onError: () => {
      toast({
        title: "Couldn't submit request",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });
};
