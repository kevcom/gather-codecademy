const {assert} = require('chai');
const request = require('supertest');
const {jsdom} = require('jsdom');

const app = require('../../app');
const Item = require('../../models/item');

const {parseTextFromHTML, buildItemObject} = require('../test-utils');
const {connectDatabaseAndDropData, diconnectDatabase} = require('../setup-teardown-utils');

const findImageElementBySource = (htmlAsString, src) => {
  const image = jsdom(htmlAsString).querySelector(`img[src="${src}"]`);
  if (image !== null) {
    return image;
  } else {
    throw new Error(`Image with src "${src}" not found in HTML string`);
  }
};

describe('Server path: /items/create', () => {
  beforeEach(connectDatabaseAndDropData);

  afterEach(diconnectDatabase);

  describe('GET', () => {
    it('renders empty input fields', async () => {
      const response = await request(app)
        .get('/items/create');
 
      assert.equal(parseTextFromHTML(response.text, 'input#title-input'), '');
      assert.equal(parseTextFromHTML(response.text, 'textarea#description-input'), '');
      assert.equal(parseTextFromHTML(response.text, 'input#imageUrl-input'), '');
 
    });
  });

  describe('POST', () => {
    it('creates a new item in database', async () => {
      const itemToCreate = buildItemObject();
      const response = await request(app)
        .post('/items/create')
        .type('form')
        .send(itemToCreate);

      const createdItem = await Item.findOne(itemToCreate);
      assert.isNotNull(createdItem, 'Item was not successfully created in the database');
    });

    it('should redirect to home page', async () => {
      const itemToCreate = buildItemObject();
      const response = await request(app)
        .post('/items/create')
        .type('form')
        .send(itemToCreate);

      assert.equal(response.status, 302);
      assert.equal(response.headers.location, '/');
    });

    it('should display an error if no title', async () => {
      const invalidItemToCreate = {
        description: 'test',
        imageUrl: 'https://www.placebear.com/200/300',
      }
      const response = await request(app)
        .post('/items/create')
        .type('form')
        .send(invalidItemToCreate);

      const allItems = await Item.find({});
      assert.equal(allItems.length, 0);

      assert.equal(response.status, 400);

      assert.include(parseTextFromHTML(response.text, 'form'), 'required');
    });

    it('should display an error if no description', async () => {
      const invalidItemToCreate = {
        title: 'test title',
        imageUrl: 'https://www.placebear.com/200/300',
      }
      const response = await request(app)
        .post('/items/create')
        .type('form')
        .send(invalidItemToCreate);

      const allItems = await Item.find({});
      assert.equal(allItems.length, 0);

      assert.equal(response.status, 400);

      assert.include(parseTextFromHTML(response.text, 'form'), 'required');
    });

    it('should display an error if no imageUrl', async () => {
      const invalidItemToCreate = {
        title: 'test title',
        description: 'test description'
      }
      const response = await request(app)
        .post('/items/create')
        .type('form')
        .send(invalidItemToCreate);

      const allItems = await Item.find({});
      assert.equal(allItems.length, 0);

      assert.equal(response.status, 400);

      assert.include(parseTextFromHTML(response.text, 'form'), 'required');
    });
  });
});
