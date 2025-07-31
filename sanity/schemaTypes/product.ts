export default {
    name: 'product',
    title: 'Product',
    type: 'document',
    fields: [
        { name: 'title', title: 'Title', type: 'string' },
        { name: 'price', title: 'Price', type: 'number' },
        { name: 'image', title: 'Image', type: 'image' },
        { name: 'description', title: 'Description', type: 'text' },
    ]
}
