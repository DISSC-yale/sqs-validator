# Secure Query System (SQS) Data Validator

Validates request data before it is used to query a database.

## Process

These tools are here to help you prepare your data for a submission to the secure query system. Your data must pass the provided validation checks, which we also run when you ultimately submit your data file.

Once your data passes all validation checks, we will review your output, which includes the job specification and group tabulations. Once we approve that output, you can submit your data file through Kiteworks. The validation output of that submitted data file must match the one we approved.

## Validation Spec

The [validation spec](validation_spec.json) includes the criteria that are checked, and job file options that are presented. A copy of this is bundled with the client application, which it uses to actually run the checks and present options. To update these criteria or options, edit the spec then run the update command:

```sh
npm run update-spec
```

## Status

This is an initial version of the validation spec and graphical interface.

The main component not yet built is the Python validator.
This will be a Python package built around the same validation spec, and will have the added ability to check that two job specs line up.

There are also several things not yet implemented in the graphical interface:

- Additional forms of reference year input handling
- Data editor
- Results preview
- Job spec validation
