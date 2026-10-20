frappe.ui.form.ControlFloat = class ControlFloat extends frappe.ui.form.ControlInt {
	static input_mode = "decimal";

	// LABOTECH: el punto del teclado numérico escribe el separador decimal del formato.
	// WHY: el navegador siempre escribe "." con NumpadDecimal. Con el formato #.###,## de
	// Labotech ese punto se lee como separador de miles y 12.5 queda en 125. Si se revierte,
	// los montos tecleados con el numpad salen multiplicados. input_mode no lo cubre: solo
	// cambia el teclado en pantalla del celular. Commit 775ed40f86.
	make_input() {
		super.make_input();
		this.bind_numpad_decimal_shortcut();
	}

	bind_numpad_decimal_shortcut() {
		if (this._numpad_decimal_bound || !this.$input) return;
		this._numpad_decimal_bound = true;

		this.$input.on("keydown", (e) => {
			const code = e.code || e.originalEvent?.code;
			if (code !== "NumpadDecimal") return;
			if (e.ctrlKey || e.metaKey || e.altKey) return;

			const decimal_separator = this.get_decimal_separator();

			// Keep the default browser behavior when the locale decimal separator is already a dot.
			if (!decimal_separator || decimal_separator === ".") return;

			e.preventDefault();
			this.insert_at_cursor(decimal_separator);
		});
	}

	get_decimal_separator() {
		const info = get_number_format_info(this.get_number_format() || get_number_format());
		return info.decimal_str || ".";
	}

	insert_at_cursor(value) {
		const input = this.$input?.get(0);
		if (!input) return;

		const start = input.selectionStart ?? input.value.length;
		const end = input.selectionEnd ?? input.value.length;

		if (typeof input.setRangeText === "function") {
			input.setRangeText(value, start, end, "end");
		} else {
			input.value = input.value.slice(0, start) + value + input.value.slice(end);
			input.selectionStart = input.selectionEnd = start + value.length;
		}

		input.dispatchEvent(new Event("input", { bubbles: true }));
	}

	parse(value) {
		value = this.eval_expression(value);
		return isNaN(parseFloat(value)) ? null : flt(value, this.get_precision());
	}

	format_for_input(value) {
		if (value === null || value === undefined || isNaN(Number(value))) {
			return "";
		}

		return format_number(value, this.get_number_format(), this.get_precision());
	}

	get_number_format() {
		if (this.df.fieldtype === "Float" && !this.df.options?.trim()) return;

		const currency = frappe.meta.get_field_currency(this.df, this.get_doc());
		return get_number_format(currency);
	}

	get_precision() {
		// round based on field precision or float precision, else don't round
		return this.df.precision || cint(frappe.boot.sysdefaults.float_precision, null);
	}
};

frappe.ui.form.ControlPercent = frappe.ui.form.ControlFloat;
