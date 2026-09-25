import axios from 'axios'
import { config } from 'dotenv'
import { Telegraf } from "telegraf"
import fs from "fs/promises"
import path from "path"
config()

if (!process.env.TG_BOT_TOKEN) {
    throw new Error('Отсутствую uniqueId for TgBot')
}

const BOTURL = `https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendPhoto`

const bot = new Telegraf(process.env.TG_BOT_TOKEN);
bot.telegram.setMyCommands([
    { command: 'start', description: 'Запустить бота' },
    { command: 'who', description: 'Информация о пользователе' }
]);
bot.start((ctx) => ctx.reply('Добро пожаловать! Я бот для обработки ваших чеков.Пришлите мне фотографию с чеком'));
bot.help((ctx) => ctx.reply(console.log(ctx), 'Отправьте мне команду!'));

bot.command('who', (ctx) => {
    console.log(ctx)
    ctx.reply(JSON.stringify(ctx.update.message.from, 4))
})
bot.on('text', (ctx) => {
    console.log(ctx.message)
    ctx.reply('Ответ')
});

bot.on('photo', async (ctx) => {
    try {
        const photo = ctx.message.photo[ctx.message.photo.length - 1]
        const fileLink = await ctx.telegram.getFileLink(photo.file_id)
        const response = await axios.get(fileLink.href, { responseType: 'arraybuffer' })
        const buffer = Buffer.from(response.data)

        const ext = path.extname(fileLink.pathname) || '.jpg';
        const fileName = `${photo.file_id}${ext}`;
        const imagesDir = path.join(path.resolve(), 'images')
        const filePath = path.join(imagesDir, fileName)
        await fs.mkdir(imagesDir, { recursive: true })
        await fs.writeFile(filePath, buffer)
        console.log('File was saved', fileName)
        await ctx.reply('Фото сохранено ✅')
        // await axios.post('https://some.com/upload', buffer);
    } catch (error) {
        console.error('Ошибка при обработке фото:', error);
        await ctx.reply('Не удалось сохранить фото 😔');
    }
})












bot.launch();
