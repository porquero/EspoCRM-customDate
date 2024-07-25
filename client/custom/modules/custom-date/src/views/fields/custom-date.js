define('custom-date:views/fields/custom-date', ['views/fields/base'], function (Dep) {

    return Dep.extend({

        type: 'varchar',

        listTemplate: 'custom-date:fields/custom-date/list',

        listLinkTemplate: 'custom-date:fields/custom-date/list-link',

        detailTemplate: 'custom-date:fields/custom-date/detail',

        editTemplate: 'custom-date:fields/custom-date/edit',

        searchTemplate: 'custom-date:fields/custom-date/search',

        validations: ['required'],

        initialSearchIsNotIdle: true,

        // Other formats in https://bootstrap-datepicker.readthedocs.io/en/latest/options.html#format
        dateFormat: "MM-yyyy",

        setup: function () {
            Dep.prototype.setup.call(this);

        },

        data: function () {
            var data = Dep.prototype.data.call(this);

            data.dateValue = this.getDateStringValue();

            data.isNone = data.dateValue === null;

            if (data.dateValue === -1) {
                data.dateValue = null;
                data.isLoading = true;
            }

            if (this.isSearchMode()) {
                let value = this.getSearchParamsData().value || this.searchParams.dateValue;
                let valueTo = this.getSearchParamsData().valueTo || this.searchParams.dateValueTo;

                data.dateValue = this.getDateTime().toDisplayDate(value);
                data.dateValueTo = this.getDateTime().toDisplayDate(valueTo);

                if (~['lastXDays', 'nextXDays', 'olderThanXDays', 'afterXDays']
                        .indexOf(this.getSearchType())
                ) {
                    data.number = this.searchParams.value;
                }
            }

            return data;
        },

        setupSearch: function () {
            this.events = _.extend({
                'change select.search-type': (e) => {
                    let type = $(e.currentTarget).val();

                    this.handleSearchType(type);
                },
            }, this.events || {});
        },

        stringifyDateValue: function (value) {
            if (!value) {
                if (
                    this.mode === this.MODE_EDIT ||
                    this.mode === this.MODE_SEARCH ||
                    this.mode === this.MODE_LIST ||
                    this.mode === this.MODE_LIST_LINK
                ) {
                    return '';
                }

                return null;
            }

            if (
                this.mode === this.MODE_LIST ||
                this.mode === this.MODE_DETAIL ||
                this.mode === this.MODE_LIST_LINK
            ) {
                return value;
            }

            return value;
        },

        getDateStringValue: function () {
            if (this.mode === this.MODE_DETAIL && !this.model.has(this.name)) {
                return -1;
            }

            var value = this.model.get(this.name);

            return this.stringifyDateValue(value);
        },

        afterRender: function () {
            if (this.mode === this.MODE_EDIT || this.mode === this.MODE_SEARCH) {
                this.$element = this.$el.find('[data-name="' + this.name + '"]');

                let wait = false;

                // @todo Introduce ui/date-picker.

                this.$element.on('change', (e) => {
                    if (!wait) {
                        this.trigger('change');
                        wait = true;
                        setTimeout(() => wait = false, 100);
                    }

                    if (e.isTrigger) {
                        if (document.activeElement !== this.$element.get(0)) {
                            this.$element.focus();
                        }
                    }
                });

                this.$element.on('click', () => {
                    this.$element.datepicker('show');
                });

                let options = {
                    format: this.dateFormat,
                    startView: "months", 
                    minViewMode: "months",
                    autoclose: true,
                    keyboardNavigation: true,
                    todayBtn: this.getConfig().get('datepickerTodayButton') || false,
                    orientation: 'bottom auto',
                    templates: {
                        leftArrow: '<span class="fas fa-chevron-left fa-sm"></span>',
                        rightArrow: '<span class="fas fa-chevron-right fa-sm"></span>',
                    },
                    container: this.$el.closest('.modal-body').length ?
                        this.$el.closest('.modal-body') :
                        'body',
                };

                let language = this.getConfig().get('language');

                if (!(language in $.fn.datepicker.dates)) {
                    $.fn.datepicker.dates[language] = {
                        days: this.translate('dayNames', 'lists'),
                        daysShort: this.translate('dayNamesShort', 'lists'),
                        daysMin: this.translate('dayNamesMin', 'lists'),
                        months: this.translate('monthNames', 'lists'),
                        monthsShort: this.translate('monthNamesShort', 'lists'),
                        today: this.translate('Today'),
                        clear: this.translate('Clear'),
                    };
                }

                options.language = language;

                this.$element.datepicker(options);

                if (this.mode === this.MODE_SEARCH) {
                    let $elAdd = this.$el.find('input.additional');

                    $elAdd.datepicker(options);

                    $elAdd.parent().find('button.date-picker-btn').on('click', () => {
                        $elAdd.datepicker('show');
                    });

                    this.$el.find('select.search-type').on('change', () => {
                        this.trigger('change');
                    });

                    $elAdd.on('change', e => {
                        this.trigger('change');

                        if (e.isTrigger) {
                            if (document.activeElement !== $elAdd.get(0)) {
                                $elAdd.focus();
                            }
                        }
                    });

                    $elAdd.on('click', () => {
                        $elAdd.datepicker('show');
                    });
                }

                this.$element.parent().find('button.date-picker-btn').on('click', () => {
                    this.$element.datepicker('show');
                });

                if (this.mode === this.MODE_SEARCH) {
                    let $searchType = this.$el.find('select.search-type');

                    this.handleSearchType($searchType.val());
                }
            }
        },

        handleSearchType: function (type) {
            this.$el.find('div.primary').addClass('hidden');
            this.$el.find('div.additional').addClass('hidden');
            this.$el.find('div.additional-number').addClass('hidden');

            if (~['on', 'notOn', 'after', 'before'].indexOf(type)) {
                this.$el.find('div.primary').removeClass('hidden');
            }
            else if (~['lastXDays', 'nextXDays', 'olderThanXDays', 'afterXDays'].indexOf(type)) {
                this.$el.find('div.additional-number').removeClass('hidden');
            }
            else if (type === 'between') {
                this.$el.find('div.primary').removeClass('hidden');
                this.$el.find('div.additional').removeClass('hidden');
            }
        },

        fetch: function () {
            let data = {};

            data[this.name] = this.$element.val();

            return data;
        },

        fetchSearch: function () {
            let value = this.$element.val();

            let type = this.fetchSearchType();
            let data;

            if (type === 'between') {
                if (!value) {
                    return false;
                }

                let valueTo = this.$el.find('input.additional').val();

                if (!valueTo) {
                    return false;
                }

                data = {
                    type: type,
                    value: [value, valueTo],
                    data: {
                        value: value,
                        valueTo: valueTo
                    },
                };
            } else if (~['lastXDays', 'nextXDays', 'olderThanXDays', 'afterXDays'].indexOf(type)) {
                let number = this.$el.find('input.number').val();

                data = {
                    type: type,
                    value: number,
                };
            }
            else if (~['on', 'notOn', 'after', 'before'].indexOf(type)) {
                if (!value) {
                    return false;
                }

                data = {
                    type: type,
                    value: value,
                    data: {
                        value: value,
                    },
                };
            }
            else if (type === 'isEmpty') {
                data = {
                    type: 'isNull',
                    data: {
                        type: type,
                    },
                };
            }
            else {
                data = {
                    type: type,
                };
            }

            return data;
        },

        getSearchType: function () {
            return this.getSearchParamsData().type || this.searchParams.typeFront || this.searchParams.type;
        },

        validateRequired: function () {
            if (this.isRequired()) {
                if (this.model.get(this.name) === null) {
                    let msg = this.translate('fieldIsRequired', 'messages')
                        .replace('{field}', this.getLabelText());

                    this.showValidationMessage(msg);

                    return true;
                }
            }
        },
    });
});