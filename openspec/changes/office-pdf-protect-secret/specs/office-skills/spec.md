## ADDED Requirements

### Requirement: The protect recipe treats the password as a secret

`office-pdfcraft`'s `protect` recipe SHALL take the password only from the user (no default value), SHALL NOT pass it
in any command's arguments, and SHALL remove the temp script that holds it when the run ends, also on failure.

#### Scenario: Password not given

- **WHEN** the recipe runs with `PASSWORD` unset
- **THEN** it stops before protecting anything, and no file is protected with a fixed word

#### Scenario: A step fails after the temp script is written

- **WHEN** a command after `mktemp` fails
- **THEN** the temp script is removed on exit
