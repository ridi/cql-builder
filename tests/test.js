/* global describe test expect beforeAll afterAll */

import { Insert, Select, Update, Delete, CqlBuilderError } from '../src/index';

describe('insert', () => {
  test('without table', () => {
    expect(() => Insert().build()).toThrowError(CqlBuilderError);
  });
  test('with multiple values', () => {
    const result1 = Insert().table('test_table', 'test_keyspace').value('column1', 1).value('column2', 2).build();
    expect(result1.query).toBe('INSERT INTO test_keyspace.test_table (column1, column2) VALUES (?, ?)');
    expect(result1.params).toEqual([1, 2]);
  });
  test('with option', () => {
    const result1 = Insert().table('test_table', 'test_keyspace').value('column1', 1).option('TTL', 86400).build();
    const result2 = Insert().table('test_table', 'test_keyspace')
      .value('column1', 1)
      .option('TTL', 86400)
      .option('TIMESTAMP', 12345678)
      .build();
    expect(result1.query).toBe('INSERT INTO test_keyspace.test_table (column1) VALUES (?) USING TTL ?');
    expect(result1.params).toEqual([1, 86400]);
    expect(result2.query).toBe('INSERT INTO test_keyspace.test_table (column1) VALUES (?) USING TTL ? AND TIMESTAMP ?');
    expect(result2.params).toEqual([1, 86400, 12345678]);
  });
  test('with all', () => {
    const result1 = Insert().table('test_table', 'test_keyspace')
      .value('column1', 1)
      .value('column2', 2)
      .option('TTL', 86400)
      .option('TIMESTAMP', 12345678)
      .value('column3', 3)
      .value('column4', 4)
      .build();
    const result2 = Insert().table('test_table', 'test_keyspace')
      .value('column1', 1)
      .value('column2', 2)
      .option('TTL', 86400)
      .option('TIMESTAMP', 12345678)
      .value('column3', 3)
      .value('column4', 4)
      .set('column5', 5)
      .where('key1 = ?', 'key')
      .build();
    expect(result1.query).toBe('INSERT INTO test_keyspace.test_table (column1, column2, column3, column4) VALUES (?, ?, ?, ?) USING TTL ? AND TIMESTAMP ?');
    expect(result1.params).toEqual([1, 2, 3, 4, 86400, 12345678]);
    expect(result2.query).toBe(result1.query);
    expect(result2.params).toEqual(result1.params);
  });
});

describe('select', () => {
  test('without table', () => {
    expect(() => Select().build()).toThrowError(CqlBuilderError);
    expect(() => Select().field('column_1').build()).toThrowError(CqlBuilderError);
    expect(() => Select().where('column_1 < ?', 1).build()).toThrowError(CqlBuilderError);
  });
  test('with multiple fields', () => {
    const result1 = Select().table('test_table', 'test_keyspace').field('column_1').field('column_2').field('column_3').build();
    const result2 = Select().table('test_table', 'test_keyspace').field(['column_1', 'column_2', 'column_3']).build();
    const result3 = Select().table('test_table', 'test_keyspace').field(['column_1', 'column_2']).field('column_3').build();
    expect(result1.query).toBe('SELECT column_1, column_2, column_3 FROM test_keyspace.test_table');
    expect(result2.query).toBe(result1.query);
    expect(result3.query).toBe(result1.query);
    expect(result1.params).toHaveLength(0);
    expect(result2.params).toHaveLength(0);
    expect(result3.params).toHaveLength(0);
  });
  test('without field', () => {
    const result1 = Select().table('test_table', 'test_keyspace').build();
    const result2 = Select().table('test_table', 'test_keyspace').where('column1 >= ?', 1).build();
    expect(result1.query).toBe('SELECT * FROM test_keyspace.test_table');
    expect(result2.query).toBe('SELECT * FROM test_keyspace.test_table WHERE column1 >= ?');
    expect(result2.params).toEqual([1]);
  });
  test('with multiple where', () => {
    const result1 = Select().table('test_table').where('column1 >= ?', 1).where('columns2 IN (?, ?, ?, ?)', 'a', 'b', 'c', 'd').build();
    const result2 = Select().table('test_table').where('column1 = false').where('columns2 IN (?, ?, ?, ?)', 'a', 'b', 'c', 'd').build();
    expect(result1.query).toBe('SELECT * FROM test_table WHERE column1 >= ? AND columns2 IN (?, ?, ?, ?)');
    expect(result1.params).toEqual([1, 'a', 'b', 'c', 'd']);
    expect(result2.query).toBe('SELECT * FROM test_table WHERE column1 = false AND columns2 IN (?, ?, ?, ?)');
    expect(result2.params).toEqual(['a', 'b', 'c', 'd']);
    expect(() => Select().where('column1 >= ?', 1).where('columns2 IN (?, ?, ?, ?)', 'a', 'b', 'c').build()).toThrowError(CqlBuilderError);
  });
  test('with limit', () => {
    const result1 = Select().table('test_table').limit(0).build();
    const result2 = Select().table('test_table').limit(-1).build();
    const result3 = Select().table('test_table').limit(50).build();
    expect(result1.query).toBe('SELECT * FROM test_table');
    expect(result2.query).toBe('SELECT * FROM test_table');
    expect(result3.query).toBe('SELECT * FROM test_table LIMIT ?');
    expect(result1.params).toHaveLength(0);
    expect(result2.params).toHaveLength(0);
    expect(result3.params).toEqual([50]);
  });
  test('with order', () => {
    const result1 = Select().table('test_table').order('key1').build();
    const result2 = Select().table('test_table').order('key2 ASC').build();
    expect(result1.query).toBe('SELECT * FROM test_table ORDER BY key1');
    expect(result2.query).toBe('SELECT * FROM test_table ORDER BY key2 ASC');
  });
  test('with count(*)', () => {
    const result1 = Select().table('test_table', 'test_keyspace').field('COUNT(*)').build();
    expect(result1.query).toBe('SELECT COUNT(*) FROM test_keyspace.test_table');
  });
  test('with all', () => {
    const result1 = Select()
      .table('test_table', 'test_keyspace')
      .field(['column1', 'column2'])
      .field('column3')
      .where('key1 = ?', 1000)
      .where('key2 > ?', 2000)
      .where('key3 IN (?, ?)', 3000, 4000)
      .limit(5000)
      .order('key1 DESC')
      .build();
    const result2 = Select()
      .table('test_table', 'test_keyspace')
      .field(['column1', 'column2'])
      .field('column3')
      .where('key1 = ?', 1000)
      .where('key2 > ?', 2000)
      .limit(5000)
      .order('key1 DESC')
      .value('column1', 'a')
      .where('key3 IN (?, ?)', 3000, 4000)
      .value('column2', 'b')
      .set('column3', 'c')
      .set('column4', 'd')
      .option('TTL', 86400)
      .build();
    expect(result1.query).toBe('SELECT column1, column2, column3 FROM test_keyspace.test_table WHERE key1 = ? AND key2 > ? AND key3 IN (?, ?) ORDER BY key1 DESC LIMIT ?');
    expect(result2.query).toBe(result1.query);
    expect(result1.params).toEqual([1000, 2000, 3000, 4000, 5000]);
    expect(result2.params).toEqual(result1.params);
  });
});

describe('update', () => {
  test('without table', () => {
    expect(() => Update().build()).toThrowError(CqlBuilderError);
  });
  test('with multiple where', () => {
    const result1 = Update().table('test_table').set('column1', 1).where('key1 = ?', 'a').build();
    const result2 = Update().table('test_table').set('column1', 1).where('key1 = ?', 'a').set('column2', 2).where('key2 = ?', 'b').build();
    expect(result1.query).toBe('UPDATE test_table SET column1 = ? WHERE key1 = ? IF EXISTS');
    expect(result1.params).toEqual([1, 'a']);
    expect(result2.query).toBe('UPDATE test_table SET column1 = ?, column2 = ? WHERE key1 = ? AND key2 = ? IF EXISTS');
    expect(result2.params).toEqual([1, 2, 'a', 'b']);
  });
  test('with option', () => {
    const result1 = Update().table('test_table').set('column1', 1).option('TTL', 3000).build();
    expect(result1.query).toBe('UPDATE test_table USING TTL ? SET column1 = ? IF EXISTS');
    expect(result1.params).toEqual([3000, 1]);
  });
  test('with upsert', () => {
    const result1 = Update().table('test_table').set('column1', 1).where('key1 = ?', 'a').upsert(true).build();
    expect(result1.query).toBe('UPDATE test_table SET column1 = ? WHERE key1 = ?');
    expect(result1.params).toEqual([1, 'a']);
  });
});

describe('delete', () => {
  test('without table', () => {
    expect(() => Delete().build()).toThrowError(CqlBuilderError);
  });
  test('with multiple where', () => {
    const result1 = Delete().table('test_table').where('key1 = ?', 'a').build();
    const result2 = Delete().table('test_table').where('key1 = ?', 'a').where('key2 = ?', 'b').build();
    expect(result1.query).toBe('DELETE FROM test_table WHERE key1 = ?');
    expect(result1.params).toEqual(['a']);
    expect(result2.query).toBe('DELETE FROM test_table WHERE key1 = ? AND key2 = ?');
    expect(result2.params).toEqual(['a', 'b']);
  });
  test('with option', () => {
    const result1 = Delete().table('test_table').where('key1 = ?', 'a').option('TIMESTAMP', 12345678).build();
    expect(result1.query).toBe('DELETE FROM test_table USING TIMESTAMP ? WHERE key1 = ?');
    expect(result1.params).toEqual([12345678, 'a']);
  });
  test('with multiple fields', () => {
    const result1 = Delete().table('test_table').where('key1 = ?', 'a').field(['column1', 'column2']).build();
    expect(result1.query).toBe('DELETE column1, column2 FROM test_table WHERE key1 = ?');
    expect(result1.params).toEqual(['a']);
  });
});
