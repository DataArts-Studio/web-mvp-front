import { useMutation, useQueryClient } from '@tanstack/react-query';







export const useArchive = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {},
    onSuccess: async () => {
    }
  })
};