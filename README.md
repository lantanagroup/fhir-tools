# fhir-backup

## Installation

```bash
# Install globally
npm install fhir-tools -g
```
```bash
# Clone and install
git clone https://github.com/lantanagroup/fhir-tools
cd fhir-tools
npm install 
```

## Commands

```bash
# If installed globally
fhir-tools <command> <parameters> --options
```
```bash
# If running from cloned repo
node index.js <command> <parameters> --options
```

| Command       | Description                                                                                                                            |
|---------------|----------------------------------------------------------------------------------------------------------------------------------------|
| create-bundle | Creates a bundle from one or more paths in the form of directories, package.tgz files on the file system, or urls to package.tgz files |
| fixids        | Fix number-only ids of resources in a bundle so they can be imported with HAPI                                                         |
| delete | Delete all resources from a FHIR server |
| transfer | Transfer resources from one server to another |
| import | Import resources from a Bundle file onto the specified server |
| bulk-analyze | Analyze resources from bulk ndjson files in a directory |
| compare | Compare the resources from one FHIR server to another |
| export | Export data from a FHIR server | 
| get-all-resource-ids | Gets all resource ids for the specified resource types from a FHIR server |

## Help

```bash
# If installed globally:
fhir-tools --help
fhir-tools <command> --help
```
```bash
# If running from cloned repo
node index.js --help
node index.js <command> --help
```