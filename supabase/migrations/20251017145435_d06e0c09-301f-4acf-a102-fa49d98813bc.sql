-- Allow authenticated users to view public profile information
-- This is needed for food listings/requests to display giver/receiver names and organization info
CREATE POLICY "Authenticated users can view public profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Note: Phone and bio should still be private - apps should not select these fields in public queries