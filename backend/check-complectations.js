const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkComplectations() {
    try {
        // Проверяем, есть ли заказы с комплектацией ID 1
        const complectations = await prisma.orderComplectation.findMany({
            where: {
                subServiceId: 1
            },
            include: {
                order: true,
                subService: true
            }
        });

        console.log('Найдено заказов с комплектацией ID 1:', complectations.length);

        if (complectations.length > 0) {
            console.log('Детали заказов:');
            complectations.forEach((comp, index) => {
                console.log(`${index + 1}. Заказ ID: ${comp.orderId}, Комплектация: ${comp.subService.name}, Количество: ${comp.quantity}`);
            });
        }

        // Проверяем все комплектации
        const allComplectations = await prisma.orderComplectation.findMany({
            include: {
                subService: true
            }
        });

        console.log('\nВсего заказов с комплектациями:', allComplectations.length);

    } catch (error) {
        console.error('Ошибка:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkComplectations(); 