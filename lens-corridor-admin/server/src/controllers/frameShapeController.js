const FrameShape = require('../models/FrameShape')

const sanitizeFrameShape = (doc) => ({
    id: doc._id,
    shape: doc.shape,
    title: doc.title,
    image: doc.image || '',
    imageAlt: doc.imageAlt || '',

    subtitle: doc.subtitle,
    meta: doc.meta,
    code: doc.code,
    status: doc.status,
    priority: doc.priority,
    detailValues: doc.detailValues || [
        doc.title,
        doc.title,
        doc.subtitle || '',
        doc.description || '',
        doc.priority,
        doc.status,
        doc.code,
    ],
})

const listFrameShapes = async (req, res) => {
    try {
        const items = await FrameShape.find().sort({ priority: 1, title: 1 })
        res.json(items.map(sanitizeFrameShape))
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch frame shapes' })
    }
}

// PUT /api/frame-shapes/:id - admin updates image/url/title/metadata
const updateFrameShape = async (req, res) => {
    try {
        const { id } = req.params
        const {
            title,
            subtitle,
            meta,
            code,
            status,
            priority,
            description,
            image,
            imageAlt,
            shape,
            detailValues,
        } = req.body || {}

        const update = {
            ...(shape ? { shape } : {}),
            ...(title ? { title } : {}),
            ...(subtitle !== undefined ? { subtitle } : {}),
            ...(meta !== undefined ? { meta } : {}),
            ...(code !== undefined ? { code } : {}),
            ...(status !== undefined ? { status } : {}),
            ...(priority !== undefined ? { priority } : {}),
            ...(description !== undefined ? { description } : {}),
            ...(image !== undefined ? { image } : {}),
            ...(imageAlt !== undefined ? { imageAlt } : {}),
            ...(detailValues !== undefined ? { detailValues } : {}),
        }

        const updated = await FrameShape.findByIdAndUpdate(id, update, { new: true })
        if (!updated) {
            return res.status(404).json({ error: 'Frame shape not found' })
        }

        res.json(sanitizeFrameShape(updated))
    } catch (error) {
        res.status(500).json({ error: 'Failed to update frame shape' })
    }
}

const uploadFrameShapeImage = async (req, res) => {
    try {
        const { id } = req.params
        const file = req.file

        if (!file) {
            return res.status(400).json({ error: 'Image file is required' })
        }

        const { imageAlt } = req.body || {}

        // Save relative path so it works behind static serving (see app static mount)
        // Update if your server serves uploads differently.
        const imagePath = `/uploads/frame-shapes/${file.filename}`

        const updated = await FrameShape.findByIdAndUpdate(
            id,
            { image: imagePath, ...(imageAlt !== undefined ? { imageAlt } : {}) },
            { new: true },
        )

        if (!updated) {
            return res.status(404).json({ error: 'Frame shape not found' })
        }

        res.json(sanitizeFrameShape(updated))
    } catch (error) {
        res.status(500).json({ error: 'Failed to upload frame shape image' })
    }
}

module.exports = { listFrameShapes, updateFrameShape, uploadFrameShapeImage }




