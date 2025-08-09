// schemas/product.ts
import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'defaultImage',
      title: 'Default Image',
      type: 'image',
      options: { hotspot: true },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'colors',
      title: 'Available Colors',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Red', value: 'Red' },
          { title: 'Blue', value: 'Blue' },
          { title: 'Green', value: 'Green' },
          { title: 'Black', value: 'Black' },
          { title: 'White', value: 'White' },
          { title: 'Brown', value: 'Brown' },
          { title: 'Beige', value: 'Beige' },
          { title: 'Gold', value: 'Gold' },
          { title: 'Silver', value: 'Silver' },
        ]
      },
      validation: Rule => Rule.min(1).error('Select at least one color')
    }),
    defineField({
      name: 'price',
      title: 'Base Price',
      type: 'number',
      validation: Rule => Rule.required().min(0)
    }),
    defineField({
      name: 'variants',
      title: 'Variants',
      type: 'array',
      of: [
        defineField({
          name: 'variant',
          title: 'Variant',
          type: 'object',
          fields: [
            {
              name: 'color',
              title: 'Color',
              type: 'string',
              options: {
                // Dynamically pulls colors chosen above
                list: [], // will be populated in Studio UI
              },
              validation: Rule => Rule.required()
            },
            {
              name: 'size',
              title: 'Size',
              type: 'string',
              options: {
                list: [
                  { title: 'XS', value: 'XS' },
                  { title: 'S', value: 'S' },
                  { title: 'M', value: 'M' },
                  { title: 'L', value: 'L' },
                  { title: 'XL', value: 'XL' },
                  { title: 'XXL', value: 'XXL' },
                ]
              },
              validation: Rule => Rule.required()
            },
            {
              name: 'quantity',
              title: 'Quantity',
              type: 'number',
              validation: Rule => Rule.required().min(0)
            },
            {
              name: 'overridePrice',
              title: 'Override Price (Optional)',
              type: 'number',
            },
            {
              name: 'sku',
              title: 'SKU',
              type: 'string',
              readOnly: true
            }
          ]
        })
      ]
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96
      },
      validation: Rule => Rule.required()
    })
  ]
})