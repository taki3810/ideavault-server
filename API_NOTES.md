# API Implementation Notes

JWT middleware verifies Bearer tokens and stores the decoded email on the request.

Idea APIs support create, read, update, delete, search by regex, category filtering, date range filtering, and limited trending results.

Comment APIs allow authenticated users to add comments and only edit or delete their own comments.

My Ideas and My Interactions endpoints validate the query email against the JWT email before returning private data.
