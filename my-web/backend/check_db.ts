import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({ where: { email: 'merchant01@gmail.com' } });
    if (!user) return console.log('User not found');
    
    console.log('User:', user.id, user.email, 'hasCompletedOnboarding:', user.isEmailVerified);
    
    const restaurants = await prisma.restaurant.findMany({
        where: { ownerId: user.id },
        include: { _count: { select: { foods: true, categoryGroups: true } } }
    });
    
    console.log('Restaurants:');
    console.table(restaurants.map(r => ({
        id: r.id, name: r.name, foods: r._count.foods, cats: r._count.categoryGroups
    })));
}

main().finally(() => prisma.$disconnect());
