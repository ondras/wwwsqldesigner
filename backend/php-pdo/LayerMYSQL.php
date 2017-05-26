<?php

class LayerMYSQL extends AbstractLayer
{
    # Generic
    public static function protect($value,$alias=NULL)
    {
        return '`'.str_replace('.','`.`',$value).'`'.($alias?' `'.$alias.'`':'');
    }

    # saveloadlist
    public static function Keywords($table,$keyword='')
    {
        $req = '
                SELECT
            ';
        if($keyword)
            $req .= ' '.self::protect('data').' ';
        else
            $req .= ' '.self::protect('keyword').' ';
        $req .= '
                FROM '.self::protect($table).'
            ';
        if($keyword)
            $req .= ' WHERE '.self::protect('keyword').' = ? ';
        else
            $req .= ' ORDER BY '.self::protect('dt').' DESC ';

        $q = self::$pdo->prepare($req);
        if($keyword)
            $q->bindValue($keyword,'string');
        return $q->execute();
    }
    public static function KeywordsInsert($table,$keyword,$data)
    {
        $req = '
                INSERT INTO '.self::protect($table).'
                    ('.self::protect('keyword').', '.self::protect('data').')
                VALUES (?, ?)
            ';
        return self::$pdo->prepare($req)->bindValue($keyword,'string')->bindValue($data,'string')->execute();
    }
    public static function KeywordsUpdate($table,$keyword,$data)
    {
        $req = '
                UPDATE '.self::protect($table).'
                SET '.self::protect('data').' = ?
                WHERE '.self::protect('keyword').' = ?
            ';
        return self::$pdo->prepare($req)->bindValue($data,'string')->bindValue($keyword,'string')->execute();
    }

    # datatypes
    public static function DatatypesFile()
    {
        return dirname(__FILE__).'/../../db/mysql/datatypes.xml';
    }

    # model
    public static $schema = NULL;
    public static function Tables()
    {
        if(is_null(self::$schema))
            self::$schema = BackendPhpPdo::req('database');
        if(is_null(self::$schema))
            self::$schema = 'information_schema';

        $req = '
                SELECT
                    '.self::protect('TABLE_NAME').' as '.self::protect('name').',
                    '.self::protect('TABLE_COMMENT').' as '.self::protect('comment').'
                FROM '.self::protect('TABLES').'
                WHERE
                    '.self::protect('TABLE_SCHEMA').' = ?
            ';
        return self::$pdo->prepare($req)->bindValue(self::$schema,'string')->execute()->fetchAll();
    }
    private static $columns = array();
    public static function Columns($table)
    {
        if(isset(self::$columns[$table['name']]))
           return self::$columns[$table['name']]; 
        if(!empty(self::$columns))
            return array();

        $req = '
                SELECT
                    '.self::protect('TABLE_NAME').' as '.self::protect('table').',
                    '.self::protect('COLUMN_NAME').' as '.self::protect('name').',
                    '.self::protect('COLUMN_TYPE').' as '.self::protect('type').',
                    '.self::protect('IS_NULLABLE').' as '.self::protect('null').',
                    '.self::protect('COLUMN_DEFAULT').' as '.self::protect('default').',
                    '.self::protect('COLUMN_COMMENT').' as '.self::protect('comment').',
                    '.self::protect('EXTRA').' as '.self::protect('autoincrement').'
                FROM '.self::protect('COLUMNS').'
                WHERE
                    '.self::protect('TABLE_SCHEMA').' = ?
            ';
        $columns = self::$pdo->prepare($req)->bindValue(self::$schema,'string')->execute()->fetchAll();
        foreach($columns as $k=>$column)
        {
            $column['type'] = strtoupper($column['type']);
            $column['null'] = ($column['null'] == 'YES' ? '1' : '0');
            $column['default'] = ($column['default'] == 'NULL' ? '' : $column['default']);
            $column['autoincrement'] = preg_match('/auto_increment/i',$column['autoincrement']) ? '1' : '0';
            self::$columns[$column['table']][] = $column;
        }
        return self::$columns[$table['name']];
    }
    private static $relations = array();
    public static function Relations($table,$column)
    {
        if(isset(self::$relations[$table['name']][$column['name']]))
           return self::$relations[$table['name']][$column['name']];
        if(!empty(self::$relations))
            return array();

        $req = '
                SELECT
                    '.self::protect('c.TABLE_NAME').' as '.self::protect('table_src').',
                    '.self::protect('k.COLUMN_NAME').' as '.self::protect('column_src').',
                    '.self::protect('REFERENCED_TABLE_NAME').' as '.self::protect('table').',
                    '.self::protect('REFERENCED_COLUMN_NAME').' as '.self::protect('column').'
                FROM '.self::protect('KEY_COLUMN_USAGE','k').'
                LEFT JOIN '.self::protect('TABLE_CONSTRAINTS','c').'
                    ON '.self::protect('k.CONSTRAINT_NAME').' = '.self::protect('c.CONSTRAINT_NAME').'
                WHERE
                    '.self::protect('c.TABLE_SCHEMA').' = ?
            ';
        $relations = self::$pdo->prepare($req)->bindValue(self::$schema,'string')->execute()->fetchAll();
        foreach($relations as $relation)
            self::$relations[$relation['table_src']][$relation['column_src']][] = $relation;

        if(isset(self::$relations[$table['name']][$column['name']]))
            return self::$relations[$table['name']][$column['name']];
        return array();
    }
    private static $keys = array();
    public static function Keys($table)
    {
        if(isset(self::$keys[$table['name']]))
           return self::$keys[$table['name']];
        if(!empty(self::$keys))
            return array();

        $req = '
                SELECT
                    '.self::protect('TABLE_NAME').' as '.self::protect('table').',
                    '.self::protect('INDEX_NAME').' as '.self::protect('name').',
                    '.self::protect('INDEX_TYPE').' as '.self::protect('type').',
                    '.self::protect('COLUMN_NAME').' as '.self::protect('column').',
                    '.self::protect('NON_UNIQUE').' as '.self::protect('non_unique').'
                FROM '.self::protect('STATISTICS').'
                WHERE
                    '.self::protect('TABLE_SCHEMA').' = ?
                ORDER BY '.self::protect('SEQ_IN_INDEX').'
            ';
        $indexes = self::$pdo->prepare($req)->bindValue(self::$schema,'string')->execute()->fetchAll();

        $keys = array();
        foreach($indexes as $index)
        {
            if($index['type'] != 'FULLTEXT')
                $index['type'] = 'INDEX';
            if($index['non_unique'] == '0')
                $index['type'] = 'UNIQUE';
            if($index['name'] == 'PRIMARY')
                $index['type'] = 'PRIMARY';
            self::$keys[$index['table']][$index['name']]['type'] = $index['type'];
            self::$keys[$index['table']][$index['name']]['columns'][] = $index['column'];
        }

		if (isset(self::$keys[$table['name']])) {
			return self::$keys[$table['name']];
		} else {
			return array();
		}
    }
}

?>
