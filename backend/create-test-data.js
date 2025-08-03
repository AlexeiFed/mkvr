/**
 * @file: create-test-data.js
 * @description: Скрипт для создания тестовых данных в базе
 * @dependencies: Prisma Client
 * @created: 2025-01-29
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestData() {
    try {
        console.log('🔧 Создание тестовых данных...');

        // Создаем школу если её нет
        let school = await prisma.school.findFirst({
            where: { name: 'Тестовая школа №1' }
        });

        if (!school) {
            school = await prisma.school.create({
                data: {
                    name: 'Тестовая школа №1',
                    address: 'Москва, ул. Тестовая, д. 1',
                    isActive: true
                }
            });
            console.log('✅ Создана школа:', school.name);
        } else {
            console.log('✅ Школа уже существует:', school.name);
        }

        // Создаем классы с правильными сменами
        const classes = [
            { name: '1А', shift: '1', schoolId: school.id },
            { name: '1Б', shift: '2', schoolId: school.id },
            { name: '2А', shift: '1', schoolId: school.id },
            { name: '2Б', shift: '2', schoolId: school.id },
            { name: '3А', shift: '1', schoolId: school.id },
            { name: '3Б', shift: '2', schoolId: school.id }
        ];

        for (const classData of classes) {
            try {
                const existingClass = await prisma.class.findFirst({
                    where: {
                        name: classData.name,
                        schoolId: school.id
                    }
                });

                if (!existingClass) {
                    await prisma.class.create({
                        data: classData
                    });
                    console.log(`✅ Создан класс: ${classData.name} (смена ${classData.shift})`);
                } else {
                    // Обновляем смену если её нет
                    if (!existingClass.shift) {
                        await prisma.class.update({
                            where: { id: existingClass.id },
                            data: { shift: classData.shift }
                        });
                        console.log(`✅ Обновлена смена для класса: ${classData.name} (смена ${classData.shift})`);
                    } else {
                        console.log(`✅ Класс уже существует: ${classData.name} (смена ${existingClass.shift})`);
                    }
                }
            } catch (error) {
                if (error.code === 'P2002') {
                    console.log(`⚠️ Класс ${classData.name} уже существует, пропускаем`);
                } else {
                    console.error(`❌ Ошибка с классом ${classData.name}:`, error.message);
                }
            }
        }

        console.log('🎉 Тестовые данные созданы успешно!');
    } catch (error) {
        console.error('❌ Ошибка создания тестовых данных:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestData(); 