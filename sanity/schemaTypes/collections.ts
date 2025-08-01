// schemas/collections.ts

export default {
  name: 'collection',
  title: 'Collection',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Collection Name',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    },
    {
      name: 'image',
      title: 'Display Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'slug',
      title: 'Slug / Link',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
    },
    {
      name: 'linkTarget',
      title: 'Link Target (e.g. /product?category=men)',
      type: 'string',
      description: 'The path where clicking this collection will navigate.',
      validation: Rule => Rule.required(),
    },
  ],
}