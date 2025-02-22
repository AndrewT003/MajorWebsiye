const { ObjectId } = require('mongodb');
const connectToDatabase = require('./database');

function ChangeOrderImg(app) {
    // Сторінка редагування фото
    app.get('/admin/edit/photo', (req, res) => {
        res.render('changeOrderImg');
    });

    // Отримати фото за категорією
    app.get('/admin/edit/photo', async (req, res) => {
        const { category } = req.query;
        if (!category) {
            return res.status(400).json({ success: false, message: 'Категорія не вказана' });
        }

        try {
            const database = await connectToDatabase(); // Отримуємо підключення до бази
            const collection = database.collection(category);

            const photos = await collection.find().sort({ order: 1 }).toArray();

            const photosWithBase64 = photos.map(photo => ({
                _id: photo._id,
                base64Image: photo.base64 || `data:image/jpeg;base64,${photo.buffer?.toString('base64')}`,
                order: photo.order ?? 0
            }));

            res.json(photosWithBase64);
        } catch (error) {
            console.error('Помилка при отриманні фото:', error);
            res.status(500).json({ success: false, message: 'Помилка сервера' });
        }
    });

    // Оновлення порядку фото
    app.post('/admin/edit/update-photo-order', async (req, res) => {
        const { category, orderedPhotos } = req.body;
        if (!category || !orderedPhotos) {
            return res.status(400).json({ success: false, message: 'Некоректні дані' });
        }

        try {
            const database = await connectToDatabase(); // Отримуємо підключення до бази
            const collection = database.collection(category);

            const bulkOps = orderedPhotos.map((photo, index) => ({
                updateOne: {
                    filter: { _id: new ObjectId(photo._id) },
                    update: { $set: { order: index } }
                }
            }));

            if (bulkOps.length > 0) {
                await collection.bulkWrite(bulkOps);
            }

            res.json({ success: true, message: 'Порядок оновлено' });
        } catch (error) {
            console.error('Помилка оновлення порядку:', error);
            res.status(500).json({ success: false, message: 'Помилка сервера' });
        }
    });
}

module.exports = ChangeOrderImg;
