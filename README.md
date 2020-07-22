# fhir-backup
## Setup:
* git clone
* npm install

## Commands

### Export

Export data from a FHIR server

```
node index.js export <fhir_base> <out_file>
```

Example:

```
node index.js export https://somefhirserver.com/fhir fhir-backup.json --history --exclude AuditEvent
node index.js export https://somefhirserver.com/fhir fhir-backup.json --history -r ImplementationGuide -r StructureDefinition
```

Positionals:

| Positional | Description | Type |
| ---------- | ----------- | ---- |
| fhir_base | The base url of the fhir server | string |
| out_file | Location on computer to store the export | string |

Options:

| Parameter | Description | Type |
| --------- | ----------- | ---- |
| --page_size, -s | The size of results to return per page | number (default: 50) |
| --history, -h | Indicates if _history should be included | boolean/flag |
| --resource_type, -r | Specify one or more resource types to get backup from the FHIR server. If not specified, will default to all resources supported by the server. | string. can repeat. |
| --ig | If specified, indicates that the resources in each ImplementationGuide should be found/retrieved and included in the export. | boolean/flag |
| --exclude, -e | Resource types that should be excluded from the export (ex: AuditEvent) | string. can repeat. |
| --history_queue | The number of requests for history that can be made in parallel. | number (default: 10) |

## Import

Import data from a bundle resource into a FHIR server. Each entry/resource in the bundle is processed one-at-a-time intentionally; the backup may include history, which requires that the bundle be processed in the correct order of entries to re-create the history. Additionally, the FHIR server (if HAPI) may have issues with the meta.security tags being non-unique when creating multiple resources at the same time.

```
node index.js import <fhir_base> <in_file>   Import data to a FHIR server
```

| Positional | Description | Type |
| ---------- | ----------- | ---- |
| fhir_base | The base url of the fhir server | string |
| in_file | Location on computer of the bundle to import | string |