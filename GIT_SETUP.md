# Git Setup Guide for wispaCart

## Quick Steps to Push Your Code

### 1. Stage All Changes
```bash
git add .
```

### 2. Commit Changes
```bash
git commit -m "Initial commit: wispaCart e-commerce app"
```

### 3. Create Repository on GitHub/GitLab/Bitbucket
- Go to your Git hosting service
- Create a new repository (don't initialize with README)
- Copy the repository URL

### 4. Add Remote Repository
```bash
git remote add origin <your-repository-url>
```

**Examples:**
- GitHub HTTPS: `git remote add origin https://github.com/yourusername/wispaCart.git`
- GitHub SSH: `git remote add origin git@github.com:yourusername/wispaCart.git`

### 5. Push to Repository
```bash
git push -u origin master
```

Or if your default branch is `main`:
```bash
git push -u origin main
```

## Future Updates

After the initial push, for future updates:

```bash
# Stage changes
git add .

# Commit
git commit -m "Description of your changes"

# Push
git push
```

## Check Current Status

```bash
# See what files have changed
git status

# See your commit history
git log

# Check if remote is configured
git remote -v
```

## Pushing to Another Branch

### Option 1: Create a New Branch and Push
```bash
# Create and switch to a new branch
git checkout -b new-branch-name

# Or using newer syntax
git switch -c new-branch-name

# Stage and commit your changes (if not already committed)
git add .
git commit -m "Your commit message"

# Push the new branch to remote
git push -u origin new-branch-name
```

### Option 2: Push Current Branch to a Different Remote Branch
```bash
# Push your current branch to a different branch name on remote
git push -u origin current-branch-name:remote-branch-name
```

### Option 3: Switch to Existing Branch and Push
```bash
# Switch to an existing branch
git checkout branch-name

# Or using newer syntax
git switch branch-name

# Make sure your changes are committed, then push
git push -u origin branch-name # push to branch 
```

### Option 4: Push All Branches
```bash
# Push all local branches to remote
git push --all origin
```

## Common Issues

### If you get "remote origin already exists"
```bash
# Remove existing remote
git remote remove origin

# Add new remote
git remote add origin <your-repository-url>
```

### If you get authentication errors
- For HTTPS: Use a Personal Access Token instead of password
- For SSH: Make sure your SSH key is added to your Git account

### If branch name is different
```bash
# Check current branch
git branch

# Rename branch to main (if needed)
git branch -M main
```

