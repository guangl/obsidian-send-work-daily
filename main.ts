import { App, Notice, Plugin, PluginSettingTab, Setting, moment } from 'obsidian';
import { createTransport  } from 'nodemailer';
import { Options } from 'nodemailer/lib/mailer';

interface SendEmailPluginSettings {
	host: string;
	port: number;
	ssl: boolean;
	password: string;
	from: string;
	to: string;
	cc: string;
	bcc: string;
	subjectFormat: string;
}

const DEFAULT_SETTINGS: SendEmailPluginSettings = {
	host: '',
	port: 0,
	ssl: true,
	password: '',
	from: '',
	to: '',
	cc: '',
	bcc: '',
	subjectFormat: ''
}

export default class SendEmailPlugin extends Plugin {
	settings: SendEmailPluginSettings;

	async onload() {
		await this.loadSettings();
		this.addCommand({
			id: 'send-mail',
			name: 'Send Mail',
			editorCallback: () => this.sendMail()
		});

		this.registerInterval(
			window.setInterval(() => {
				const hour = moment().hour();
				if (hour === 22) {
					this.sendMail();
				}
			}, 1000 * 60 * 60)
		);

		this.addSettingTab(new SendEmailSettingTab(this.app, this));
	}

	onunload() {

	}

	async sendMail() {
		const { vault } = this.app;
		const to = this.settings.to.split(',').map(item => item.trim());
		const cc = this.settings.cc.split(',').map(item => item.trim());
		const bcc = this.settings.bcc.split(',').map(item => item.trim());

		const todayDaily = vault.getMarkdownFiles().find(item => item.basename === `${moment().format('YYYY-MM-DD')}`);
		if (todayDaily === undefined) { new Notice('no daily file!'); return; }
		const todayDailyContent = await vault.cachedRead(todayDaily);
		const workContent = todayDailyContent.split('## Work')[1].trim();

		if (workContent.length === 0) {
			new Notice('send error! content is empty!');
			return;
		}

		const mailTransport = createTransport({
			host: this.settings.host,
			secure: this.settings.ssl,
			port: this.settings.port,
			auth: {
				user: this.settings.from,
				pass: this.settings.password
			}
		});

		const sendMailOption: Options = {
			from: this.settings.from,
			to,
			cc,
			bcc,
			subject: this.settings.subjectFormat.replace('${YYYYMMDD}', moment().format('YYYYMMDD')),
			text: workContent
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

class SendEmailSettingTab extends PluginSettingTab {
	plugin: SendEmailPlugin;

	constructor(app: App, plugin: SendEmailPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h1', { text: '邮箱设置' });

		new Setting(containerEl)
			.setName('Host')
			.setDesc('邮箱发送服务 (stmp)')
			.addText(text => text
				.setPlaceholder('Enter your host')
				.setValue(this.plugin.settings.host)
				.onChange(async (value) => {
					this.plugin.settings.host = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Port')
			.setDesc('邮箱发送服务端口号')
			.addText(text => text
				.setPlaceholder('Enter your port')
				.setValue(this.plugin.settings.port.toString())
				.onChange(async (value) => {
					this.plugin.settings.port = parseInt(value);
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('SSL')
			.setDesc('邮箱发送服务是否使用SSL')
			.addToggle(toggle => toggle
				.setTooltip('是否使用SSL')
				.setValue(this.plugin.settings.ssl)
				.onChange(async (value) => {
					this.plugin.settings.ssl = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName('Password')
			.setDesc('邮箱一次性密码')
			.addText(text => text
				.setPlaceholder('Enter your password')
				.setValue(this.plugin.settings.password)
				.onChange(async (value) => {
					this.plugin.settings.password = value;
					await this.plugin.saveSettings();
				}));

		containerEl.createEl('h1', { text: '联系人' });

		new Setting(containerEl)
			.setName('From')
			.setDesc('发件人')
			.addText(text => text
				.setPlaceholder('Enter your from')
				.setValue(this.plugin.settings.from)
				.onChange(async (value) => {
					this.plugin.settings.from = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('To')
			.setDesc('收件人，使用 \',\' 分割')
			.addText(text => text
				.setPlaceholder('Enter your to')
				.setValue(this.plugin.settings.to)
				.onChange(async (value) => {
					this.plugin.settings.to = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Cc')
			.setDesc('抄送人，使用 \',\' 分割')
			.addText(text => text
				.setPlaceholder('Enter your cc')
				.setValue(this.plugin.settings.cc)
				.onChange(async (value) => {
					this.plugin.settings.cc = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Bcc')
			.setDesc('密送人，使用 \',\' 分割')
			.addText(text => text
				.setPlaceholder('Enter your bcc')
				.setValue(this.plugin.settings.bcc)
				.onChange(async (value) => {
					this.plugin.settings.bcc = value;
					await this.plugin.saveSettings();
				}));

		containerEl.createEl('h1', { text: '邮件主题设置' });

		new Setting(containerEl)
			.setName('Subject')
			.setDesc('邮件主题')
			.addText(text => text
				.setPlaceholder('Enter your subject format')
				.setValue(this.plugin.settings.subjectFormat)
				.onChange(async (value) => {
					this.plugin.settings.subjectFormat = value;
					await this.plugin.saveSettings();
				}));
	}
}
