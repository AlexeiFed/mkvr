/**
 * @file: create-test-admin.js
 * @description: Скрипт для создания тестовых пользователей на Render (только один раз)
 * @dependencies: @prisma/client, bcryptjs
 * @created: 2025-01-29
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function createTestUsers() {
    try {
        console.log('Проверка и создание таблиц базы данных...');

        // Сначала применяем схему к базе данных
        try {
            execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
            console.log('✅ Схема базы данных применена успешно');
        } catch (error) {
            console.log('Ошибка применения схемы:', error.message);
            console.log('Продолжаем...');
        }

        console.log('Проверка существующих тестовых данных...');

        // Проверяем, есть ли уже тестовые пользователи
        const existingAdmin = await prisma.user.findFirst({
            where: { email: 'admin@test.com' }
        });

        if (existingAdmin) {
            console.log('✅ Тестовые данные уже существуют!');
            console.log('\nДанные для входа:');
            console.log('Email: admin@test.com, parent@test.com, child@test.com');
            console.log('Пароль: 123456');
            return;
        }

        console.log('Создание тестовых пользователей...');

        // Создаем тестовую школу
        const school = await prisma.school.create({
            data: {
                name: 'Тестовая школа №1',
                address: 'Москва, ул. Тестовая, д. 1',
                isActive: true
            }
        });

        console.log('Школа создана:', school);

        // Создаем тестовый класс
        const classItem = await prisma.class.create({
            data: {
                name: '1А',
                schoolId: school.id
            }
        });

        console.log('Класс создан:', classItem);

        // Хешируем пароль
        const hashedPassword = bcrypt.hashSync('123456', 10);

        // Создаем тестовых пользователей
        const users = await Promise.all([
            // Админ
            prisma.user.create({
                data: {
                    email: 'admin@test.com',
                    firstName: 'Админ',
                    lastName: 'Тестовый',
                    password: hashedPassword,
                    role: 'admin',
                    age: 30
                }
            }),
            // Исполнитель
            prisma.user.create({
                data: {
                    email: 'executor@test.com',
                    firstName: 'Исполнитель',
                    lastName: 'Тестовый',
                    password: hashedPassword,
                    role: 'executor',
                    age: 25
                }
            }),
            // Родитель
            prisma.user.create({
                data: {
                    email: 'parent@test.com',
                    firstName: 'Родитель',
                    lastName: 'Тестовый',
                    password: hashedPassword,
                    role: 'parent',
                    age: 35,
                    schoolId: school.id,
                    classId: classItem.id
                }
            }),
            // Ребенок
            prisma.user.create({
                data: {
                    email: 'child@test.com',
                    firstName: 'Ребенок',
                    lastName: 'Тестовый',
                    password: hashedPassword,
                    role: 'child',
                    age: 10,
                    schoolId: school.id,
                    classId: classItem.id
                }
            })
        ]);

        console.log('Пользователи созданы:');
        users.forEach(user => {
            console.log(`- ${user.role}: ${user.email} (${user.firstName} ${user.lastName})`);
        });

        console.log('\n✅ Тестовые данные успешно созданы!');
        console.log('\nДанные для входа:');
        console.log('Email: admin@test.com, parent@test.com, child@test.com');
        console.log('Пароль: 123456');

    } catch (error) {
        console.error('Ошибка создания тестовых данных:', error);
        // Не прерываем сборку при ошибке
        console.log('Продолжаем сборку...');
    } finally {
        await prisma.$disconnect();
    }
}

createTestUsers(); 