<?php

class LayerPGSQL extends AbstractLayer
{
    # Generic
    public static function protect($value,$alias=NULL)
    {
        return '"'.str_replace('.','"."',$value).'"'.($alias?' "'.$alias.'"':'');
    }

    # saveloadlist
    public static function Keywords($table,$keyword='')
    {
        $req = '
                SELECT
            ';
        if($keyword)
            $req .= ' '.self::protect('xmldata').' ';
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
                    ('.self::protect('keyword').', '.self::protect('xmldata').')
                VALUES (?, ?)
            ';
        return self::$pdo->prepare($req)->bindValue($keyword,'string')->bindValue($data,'string')->execute();
    }
    public static function KeywordsUpdate($table,$keyword,$data)
    {
        $req = '
                UPDATE '.self::protect($table).'
                SET '.self::protect('xmldata').' = ?
                WHERE '.self::protect('keyword').' = ?
            ';
        return self::$pdo->prepare($req)->bindValue($data,'string')->bindValue($keyword,'string')->execute();
    }

    # datatypes
    public static function DatatypesFile()
    {
        return dirname(__FILE__).'/../../db/postgresql/datatypes.xml';
    }

    # model
    public static function Tables()
    {
        $req = '
                SELECT
                    '.self::protect('relname').' as '.self::protect('name').',
                    '.self::protect('c.oid').' as '.self::protect('oid').',
                    (SELECT pg_catalog.obj_description('.self::protect('c.oid').', \'pg_class\')) as '.self::protect('comment').'
                FROM pg_catalog.pg_class '.self::protect('c').'
                WHERE
                    '.self::protect('c.relname').' !~ \'^(pg_|sql_)\'
                    AND '.self::protect('c.relkind').' = \'r\'
            ';
        return self::$pdo->prepare($req)->execute()->fetchAll();
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
                    '.self::protect('table_name').' as '.self::protect('table').',
                    '.self::protect('column_name').' as '.self::protect('name').',
                    '.self::protect('data_type').' as '.self::protect('type').',
                    '.self::protect('is_nullable').' as '.self::protect('null').',
                    '.self::protect('column_default').' as '.self::protect('default')/*.',
*                    col_description(? ,ordinal_position) as '.self::protect('comment').'*/.'
                FROM information_schema.columns
                ORDER BY '.self::protect('ordinal_position').'
            ';
        $columns = self::$pdo->prepare($req)->execute()->fetchAll();
        foreach($columns as $k=>$column)
        {
            $column['type'] = strtoupper($column['type']);
            $column['null'] = ($column['null'] == 'YES' ? '1' : '0');
            $column['default'] = ($column['default'] == 'NULL' ? '' : $column['default']);
            $column['autoincrement'] = '0';
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
                    '.self::protect('kku.table_name').' as '.self::protect('table_src').',
                    '.self::protect('kku.column_name').' as '.self::protect('column_src').',
                    '.self::protect('ccu.table_name').' as '.self::protect('table').',
                    '.self::protect('ccu.column_name').' as '.self::protect('column').'
                FROM '.self::protect('information_schema.table_constraints','tc').'
                LEFT JOIN '.self::protect('information_schema.constraint_column_usage','ccu').'
                    ON '.self::protect('tc.constraint_name').' = '.self::protect('ccu.constraint_name').'
                LEFT JOIN '.self::protect('information_schema.key_column_usage','kku').'
                    ON '.self::protect('kku.constraint_name').' = '.self::protect('ccu.constraint_name').'
                WHERE
                    '.self::protect('constraint_type').' = ?
            ';
        $relations = self::$pdo->prepare($req)->bindValue('FOREIGN KEY','string')->execute()->fetchAll();
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
                    '.self::protect('tc.table_name').' as '.self::protect('table').',
                    '.self::protect('tc.constraint_name').' as '.self::protect('name').',
                    '.self::protect('tc.constraint_type').' as '.self::protect('type').',
                    '.self::protect('kcu.column_name').' as '.self::protect('column').'
                FROM '.self::protect('information_schema.table_constraints','tc').'
                LEFT JOIN '.self::protect('information_schema.key_column_usage','kcu').'
                    ON '.self::protect('tc.constraint_catalog').' = '.self::protect('tc.constraint_catalog').'
                    AND '.self::protect('tc.constraint_schema').' = '.self::protect('kcu.constraint_schema').'
                    AND '.self::protect('tc.constraint_name').' = '.self::protect('kcu.constraint_name').'
                WHERE
                    '.self::protect('constraint_type').' != ?
                ORDER BY '.self::protect('tc.constraint_name').'
            ';
        $contraints = self::$pdo->prepare($req)->bindValue('FOREIGN KEY','string')->execute()->fetchAll();

        $req = '
                SELECT
                    '.self::protect('pci.relname').' as '.self::protect('table').',
                    '.self::protect('pcx.relname').' as '.self::protect('name').',
                    '.self::protect('pa.attname').' as '.self::protect('column').',
                    '.self::protect('indisunique').' as '.self::protect('unique').',
                    '.self::protect('indisprimary').' as '.self::protect('primary').'
                FROM '.self::protect('pg_index','pi').'
                LEFT JOIN '.self::protect('pg_class','pcx').'
                    ON '.self::protect('pi.indexrelid').' = '.self::protect('pcx.oid').'
                LEFT JOIN '.self::protect('pg_class','pci').'
                    ON '.self::protect('pi.indrelid').' = '.self::protect('pci.oid').'
                LEFT JOIN '.self::protect('pg_attribute','pa').'
                    ON '.self::protect('pa.attrelid').' = '.self::protect('pci.oid').'
                    AND '.self::protect('pa.attnum').' = ANY('.self::protect('pi.indkey').')
                ORDER BY '.self::protect('pa.attnum').'
            ';
        $indexes = self::$pdo->prepare($req)->execute()->fetchAll();

        $keys = array();
        foreach($contraints as $constraint)
        {
            if($constraint['type'] == 'CHECK')
                continue;
            if($constraint['type'] == 'PRIMARY KEY')
                $constraint['type'] = 'PRIMARY';
            self::$keys[$constraint['table']][$constraint['name']]['type'] = $constraint['type'];
            self::$keys[$constraint['table']][$constraint['name']]['columns'][] = $constraint['column'];
        }
        foreach($indexes as $index)
        {
            if($index['unique'] == 't' || $index['primary'] == 't')
                continue;
            self::$keys[$index['table']][$index['name']]['type'] = 'INDEX';
            self::$keys[$index['table']][$index['name']]['columns'][] = $index['column'];
        }

        return self::$keys[$table['name']];
    }

}

?>
