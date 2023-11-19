import { App, Editor, Notice, Plugin, PluginSettingTab, Setting, moment } from 'obsidian';
import { createTransport  } from 'nodemailer';
import { Options } from 'nodemailer/lib/mailer';

interface MyPluginSettings {
	host: string;
	port: number;
	password: string;
	from: string;
	to: string;
	bcc: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	host: 'smtp.exmail.qq.com',
	port: 465,
	password: 'WSnCr8GS8cRdbrZX',
	from: 'luoguang@dameng.com',
	to: 'luoguang@dameng.com',
	bcc: 'luoguang@dameng.com'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();
		this.addCommand({
			id: 'send-mail',
			name: 'Send Mail',
			editorCallback: (editor: Editor) => this.sendMail(editor)
		});

		this.registerInterval(
			window.setInterval(() => {
				const hour = moment().hour();
				if (hour === 14) {
					this.sendMail(this.app.workspace.activeEditor?.editor);
				}
			}, 1000 * 60 * 60)
		);

		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {

	}

	sendMail(editor: Editor | undefined) {
		if (!editor) return;
		const editorContent = editor.getValue().split('## Work')[1].trim();
		if (editorContent.length === 0) {
			new Notice('send error! content is empty!');
			return;
		}

		const to = this.settings.to.split(',').map(item => item.trim());
		const bcc = this.settings.bcc.split(',').map(item => item.trim());

		const mailTransport = createTransport({
			host: this.settings.host,
			secure: true,
			port: this.settings.port,
			auth: {
				user: this.settings.from,
				pass: this.settings.password
			}
		});

		const sendMailOption: Options = {
			from: this.settings.from,
			to,
			bcc,
			subject: `工作日报 - 罗广 - ${moment().format('YYYYMMDD')}`,
			text: editorContent
		};

		mailTransport.sendMail(sendMailOption, (err, info) => {
			if (err) {
				new Notice(err.message);
			} else {
				new Notice(info.response);
			}
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Host: ')
			.addText(text => text
				.setPlaceholder('Enter your host')
				.setValue(this.plugin.settings.host)
				.onChange(async (value) => {
					this.plugin.settings.host = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Port: ')
			.addText(text => text
				.setPlaceholder('Enter your port')
				.setValue(this.plugin.settings.port.toString())
				.onChange(async (value) => {
					this.plugin.settings.port = parseInt(value);
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Password: ')
			.addText(text => text
				.setPlaceholder('Enter your password')
				.setValue(this.plugin.settings.password)
				.onChange(async (value) => {
					this.plugin.settings.password = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('From: ')
			.addText(text => text
				.setPlaceholder('Enter your from')
				.setValue(this.plugin.settings.from)
				.onChange(async (value) => {
					this.plugin.settings.from = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('To: ')
			.addText(text => text
				.setPlaceholder('Enter your to')
				.setValue(this.plugin.settings.to)
				.onChange(async (value) => {
					this.plugin.settings.to = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Bcc: ')
			.addText(text => text
				.setPlaceholder('Enter your bcc')
				.setValue(this.plugin.settings.bcc)
				.onChange(async (value) => {
					this.plugin.settings.bcc = value;
					await this.plugin.saveSettings();
				}));
	}
}
