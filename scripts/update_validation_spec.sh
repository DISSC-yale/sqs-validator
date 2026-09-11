#! /bin/bash

gzip -kf validation_spec.json
unlink public/validation_spec.json.gz
cp validation_spec.json.gz public/validation_spec.json.gz
unlink validation_spec.json.gz