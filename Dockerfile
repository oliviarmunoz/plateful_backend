FROM denoland/deno:2.5.5

# It's good practice to specify the user. Deno's image provides a non-root 'deno' user.
USER deno

# Set the working directory inside the container
WORKDIR /app

# Expose the port the application will listen on.
# The Requesting concept defaults to PORT 10000.
EXPOSE 10000

# Copy all application files into the working directory.
# CRITICAL FIX: Use --chown to ensure the 'deno' user owns the files.
# This grants the necessary write permissions for the build step.
COPY --chown=deno:deno . .

# Run the custom build step defined in deno.json.
# This step writes to src/concepts/concepts.ts and now has permission to do so.
RUN deno task build

# NOTE: We intentionally do NOT cache modules here because:
# 1. syncs.ts depends on @concepts which has a top-level await (database connection)
# 2. Caching during build time would evaluate syncs.ts before concepts are ready
# 3. This causes syncs to be cached with an empty/broken state
# 4. Modules will be cached at runtime when the container starts

# Specify the command to run when the container starts.
# Using 'deno task start' is the best practice here, as it encapsulates
# the full run command and necessary permissions from deno.json.
CMD ["deno", "task", "start"]