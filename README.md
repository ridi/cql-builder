# cql-builder

[![Greenkeeper badge](https://badges.greenkeeper.io/ridibooks/cql-builder.svg)](https://greenkeeper.io/)

Simple Cassandra CQL Builder in Javascript

## Installation

```
$ npm install --save cassandra-cql-builder
```

## Usage

```javascript
import { Insert, Select, Update, Delete, CqlBuilderError } from 'cassandra-cql-builder';

const result = Select().table('test_table', 'test_keyspace').build();

// Returns...
// result.query = 'SELECT * FROM test_keyspace.test_table'
// result.params = []
```

### Insert

Generate insert query

```javascript
const cql = Insert()
  .table('test_table', 'test_keyspace')
  .value('column1', 1)
  .option('TTL', 86400)
  .option('TIMESTAMP', 12345678)
  .build();

// Returns...
// cql.query = 'INSERT INTO test_keyspace.test_table (column1) VALUES (?) USING TTL ? AND TIMESTAMP ?'
// cql.params = [1, 86400, 12345678]
```

#### Methods

* InsertBuilder.table(table, keyspace)
* InsertBuilder.value(field, value)
* InsertBuilder.option(option, value)

### Select

Generate select query

```javascript
const cql = Select()
    .table('test_table', 'test_keyspace')
    .field(['column1', 'column2'])
    .field('column3')
    .where('key1 = ?', 1000)
    .where('key2 > ?', 2000)
    .limit(5000)
    .order('key1 DESC')
    .where('key3 IN (?, ?)', 3000, 4000)
    .option('TTL', 86400)
    .build();

// Returns...
// cql.query = 'SELECT column1, column2, column3 FROM test_keyspace.test_table WHERE key1 = ? AND key2 > ? AND key3 IN (?, ?) ORDER BY key1 DESC LIMIT ?'
// cql.params = [1000, 2000, 3000, 4000, 5000]
```

#### Methods

* SelectBuilder.table(table, keyspace)
* SelectBuilder.field(field)
* SelectBuilder.where(where, values)
* SelectBuilder.order(order)
* SelectBuilder.limit(limit)

### Update

Generate update query

```javascript
const cql = Update()
  .table('test_table')
  .set('column1', 1)
  .where('key1 = ?', 'a')
  .option('TTL', 3000)
  .upsert(true)
  .build();

// Returns...
// cql.query = 'UPDATE test_table USING TTL ? SET column1 = ? WHERE key1 = ?'
// cql.params = [3000, 1, 'a']
```

#### Methods

* UpdateBuilder.table(table, keyspace)
* UpdateBuilder.set(field, value)
* UpdateBuilder.where(where, values)
* UpdateBuilder.upsert(upsert)
* UpdateBuilder.option(option, value)

### Delete

Generate delete query

```javascript
const cql = Delete()
  .table('test_table')
  .where('key1 = ?', 'a')
  .field(['column1', 'column2'])
  .option('TIMESTAMP', 12345678)
  .build();

// Returns...
// cql.query = 'DELETE column1, column2 FROM test_table USING TIMESTAMP ? WHERE key1 = ?'
// cql.params = [12345678, 'a']
```
#### Methods

* DeleteBuilder.table(table, keyspace)
* DeleteBuilder.field(field)
* DeleteBuilder.where(where, values)
* DeleteBuilder.option(option, value)

## Development

```
$ git clone git@github.com:ridibooks/cql-builder.git
$ cd cql-builder
$ npm install
```

### Build

Webpack build using Babel (Not required in development.) 

```
$ npm run build
```

### Test

Tests using Jest

```
$ npm test
```
