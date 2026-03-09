context("Control Float", () => {
	before(() => {
		cy.login();
		cy.visit("/app/website");
	});

	function get_dialog_with_float() {
		return cy.dialog({
			title: "Float Check",
			animate: false,
			fields: [
				{
					fieldname: "float_number",
					fieldtype: "Float",
					Label: "Float",
				},
			],
		});
	}

	function get_dialog_with_percent() {
		return cy.dialog({
			title: "Percent Check",
			animate: false,
			fields: [
				{
					fieldname: "percent_number",
					fieldtype: "Percent",
					Label: "Percent",
				},
			],
		});
	}

	it("check value changes", () => {
		get_dialog_with_float().as("dialog");
		cy.wait(300);

		let data = get_data();
		data.forEach((x) => {
			cy.window()
				.its("frappe")
				.then((frappe) => {
					frappe.boot.sysdefaults.number_format = x.number_format;
				});
			x.values.forEach((d) => {
				cy.get_field("float_number", "Float").clear();
				cy.wait(200);
				cy.fill_field("float_number", d.input, "Float").blur();
				cy.get_field("float_number", "Float").should("have.value", d.blur_expected);
				cy.wait(100);
				cy.get_field("float_number", "Float").focus();
				cy.wait(100);
				cy.get_field("float_number", "Float").blur();
				cy.wait(100);
				cy.get_field("float_number", "Float").focus();
				cy.wait(100);
				cy.get_field("float_number", "Float").should("have.value", d.focus_expected);
			});
		});
	});

	it("accepts numpad decimal for locales that use comma decimals", () => {
		get_dialog_with_float().as("dialog");
		cy.wait(300);

		cy.window()
			.its("frappe")
			.then((frappe) => {
				frappe.boot.sysdefaults.number_format = "#.###,##";
			});

		cy.get_field("float_number", "Float").clear().focus().type("1");
		cy.get_field("float_number", "Float").trigger("keydown", {
			eventConstructor: "KeyboardEvent",
			key: ".",
			code: "NumpadDecimal",
			which: 110,
			keyCode: 110,
			bubbles: true,
		});
		cy.get_field("float_number", "Float").type("5").blur();

		cy.get_field("float_number", "Float").should("have.value", "1,500");
	});

	it("accepts numpad decimal in percent fields for locales that use comma decimals", () => {
		get_dialog_with_percent().as("dialog");
		cy.wait(300);

		cy.window()
			.its("frappe")
			.then((frappe) => {
				frappe.boot.sysdefaults.number_format = "#.###,##";
				frappe.boot.sysdefaults.float_precision = 3;
			});

		cy.get_field("percent_number", "Percent").clear().focus().type("1");
		cy.get_field("percent_number", "Percent").trigger("keydown", {
			eventConstructor: "KeyboardEvent",
			key: ".",
			code: "NumpadDecimal",
			which: 110,
			keyCode: 110,
			bubbles: true,
		});
		cy.get_field("percent_number", "Percent").type("5").blur();

		cy.get_field("percent_number", "Percent").should("have.value", "1,500");
	});

	function get_data() {
		return [
			{
				number_format: "#.###,##",
				values: [
					{
						input: "364.87,334",
						blur_expected: "36.487,334",
						focus_expected: "36.487,334",
					},
					{
						input: "36487,335",
						blur_expected: "36.487,335",
						focus_expected: "36.487,335",
					},
					{
						input: "2*(2+47)+1,5+1",
						blur_expected: "100,500",
						focus_expected: "100,500",
					},
				],
			},
			{
				number_format: "#,###.##",
				values: [
					{
						input: "464,87.334",
						blur_expected: "46,487.334",
						focus_expected: "46,487.334",
					},
					{
						input: "46487.335",
						blur_expected: "46,487.335",
						focus_expected: "46,487.335",
					},
					{
						input: "3*(2+47)+1.5+1",
						blur_expected: "149.500",
						focus_expected: "149.500",
					},
				],
			},
			{
				// '.' is the parseFloat's decimal separator
				number_format: "#.###,##",
				values: [
					{
						input: "12.345",
						blur_expected: "12.345,000",
						focus_expected: "12.345,000",
					},
					{
						// parseFloat would reduce 12,340 to 12,34 if this string was ever to be parsed
						input: "12.340",
						blur_expected: "12.340,000",
						focus_expected: "12.340,000",
					},
				],
			},
		];
	}
});
