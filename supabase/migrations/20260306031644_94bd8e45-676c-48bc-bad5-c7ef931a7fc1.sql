CREATE POLICY "Users can appeal own moderation_logs"
ON public.moderation_logs
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND status = 'bloqueado')
WITH CHECK (status = 'recurso');