# fhir-backup
### Setup:
* git clone
* npm install

### USAGE: 
### Export data from a FHIR server

* Positionals:
  * fhir_base  The base url of the fhir server                 [string] [required]
  * out_file   Location on computer to store the export        [string] [required]

* Options:
  * --version           Show version number                              [boolean]
  * --help              Show help                                        [boolean]
  * --page_size, -s     The size of results to return per page           [number] [default: 50]
  * --fhir_version, -v  The version of FHIR that the server supports     [string] [choices: "dstu3", "r4"] [default: "dstu3"]
