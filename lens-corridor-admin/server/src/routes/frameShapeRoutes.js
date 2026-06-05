const express = require('express')
const path = require('path')
const fs = require('fs')
const multer = require('multer')


const auth = require('../middleware/auth')
const {
    listFrameShapes,
    updateFrameShape,
    uploadFrameShapeImage,
} = require('../controllers/frameShapeController')

const router = express.Router()

// GET /api/frame-shapes
router.get('/', listFrameShapes)

// PUT /api/frame-shapes/:id (admin updates image/url/title/metadata)
router.put('/:id', auth, updateFrameShape)

// POST /api/frame-shapes/:id/image (admin uploads image)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dest = path.join(__dirname, '..', '..', 'uploads', 'frame-shapes')
        try {
            // Ensure upload directory exists (prevents ENOENT open() errors)
            fs.mkdirSync(dest, { recursive: true })
            cb(null, dest)
        } catch (e) {
            cb(e)
        }
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || ''
        const safeExt = ext ? ext.toLowerCase() : ''
        cb(null, `frame-${req.params.id}-${Date.now()}${safeExt}`)
    },
})


const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const ok = file.mimetype && file.mimetype.startsWith('image/')
        cb(ok ? null : new Error('Only image uploads are allowed'), ok)
    },
})

router.post('/:id/image', auth, upload.single('image'), uploadFrameShapeImage)

module.exports = router


