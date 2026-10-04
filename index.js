import axios from 'axios'
import { config } from 'dotenv'
import { Telegraf } from "telegraf"
import fs from "fs/promises"
import path from "path"
import { drizzle } from 'drizzle-orm/node-postgres';
import { users } from "./src/db/schema.js"
config()


const db = drizzle(process.env.DATABASE_URL);
const result = await db.execute('select * from users');
const res = await db.execute('select 1');
console.log(result.rows)

// async function main() {
//     const user = {
//         name: 'John',
//         age: 30,
//         email: 'john@example.com',
//     };
//     await db.insert(users).values(user);
//     console.log('New user created!')
//     const users = await db.select().from(users);
//     console.log('Getting all users from the database: ', users)
//     /*
//     const users: {
//       id: number;
//       name: string;
//       age: number;
//       email: string;
//     }[]
//     */
//     await db
//         .update(users)
//         .set({
//             age: 31,
//         })
//         .where(eq(users.email, user.email));
//     console.log('User info updated!')
//     await db.delete(users).where(eq(users.email, user.email));
//     console.log('User deleted!')
// }
// main();


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
