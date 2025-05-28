# EspoCRM-customDate
Use custom format in custom field date

# Install
Download and uncompress source or use the lastest release and install as extension.

# Change format
Go to file client/custom/modules/custom-date/src/views/fields/date-custom.js, and modify format in 'dateFormat' property. You can use, for example:

* MM-yyyy
* mm-yyyy
* MM-yy

More formats in: https://bootstrap-datepicker.readthedocs.io/en/latest/options.html#format


# To create consider the following
Go to file client/custom/modules/[name-field]/src/views/fields/[name-field].js

* the data type must be varchar for it to be possible to transform the field into a date, from v.8 onwards it generates custom-date conflicts
* The same libraries created previously are used but they can be defined so that they are for the global field since
* for example (remove the [' ']):
         "[name-field]": {
            "type": "varchar",
            "filter": true,
            "name": "[name-field]", //field name
            "view": "[name-field]:views/fields/[name-field]"
        },
