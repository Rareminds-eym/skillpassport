# Zoho workspace support

The workspace parent contains independent Git repositories and is not itself a
Git repository. This directory versions the Zoho plan, local setup/migration
tools and cross-repository rendered tests that belong at that parent level.
Only the files in [manifest.json](./manifest.json) are installed. Secrets,
configuration, database backups and runtime output are excluded.

Clone SkillPassport, sp-dash, sso-worker and auth-sync-consumer as siblings. From
their parent directory run:

```sh
node skillpassport/scripts/install-zoho-workspace.mjs
node skillpassport/scripts/install-zoho-workspace.mjs --apply
node skillpassport/scripts/checks/test-zoho-local-acceptance.mjs
```

Install dependencies and start the existing local database stacks before full
acceptance. See the installed root-level local testing guide for setup details.
The installer checks all contents before writing, installs only missing files,
and refuses conflicting files or destination symlinks. It does not configure
credentials, apply migrations, send email, start services or deploy anything.

After editing an installed support file, update its matching copy here before
committing. Keep the manifest synchronized when adding support files.
