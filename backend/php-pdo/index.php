<?php

error_reporting(E_ALL);

class BackendPhpPdo
{

    public static function getConfig($id)
    {
        switch($id)
        {
            case 'saveloadlist':
                $type = 'pgsql';
                $dsn = 'pgsql:dbname=wwwsqldesigner';
                $user = 'wwwsqldesigner';
                $pass = 'xxx';
                $table = 'wwwsqldesigner';
                return array($type,$dsn,$user,$pass,$table);
            case 'import':
                $type = 'pgsql';
                $dsn = 'pgsql:dbname=wwwsqldesigner;host=localhost';
                $type = 'mysql';
                $dsn = 'mysql:dbname=wwwsqldesigner;host=localhost';
                $user = 'wwwsqldesigner';
                $pass = 'xxx';
                return array($type,$dsn,$user,$pass);
        }
    }

    public $what = '';
    # PDO
    public $type = NULL;
    public $pdo = NULL;
    # PDO STATEMENT
    public $pdo_statement = NULL;
    public $req = '';
    public $pos = 0;
    # EXCEPTION
    public $message = NULL;
    public $trace = array();
    # BENCH
    public $in = 0;
    public $out = 0;
    public static $benchs = array();

    # Constructors
    public static function getPdo($type,$dsn,$user,$password)
    {
        $obj = new BackendPhpPdo();
        $obj->what = 'PDO';
        $obj->type = $type;
        try {
            $obj->pdo = new PDO($dsn,$user,$password);
        } catch( Exception $e ) {
            self::getException($e);
        }
        if(empty($obj->pdo))
            self::getException($obj);
        return $obj;
    }
    public static function getPdoStatement($pdo=NULL,$pdo_statement=NULL,$req='',$in=NULL)
    {
        $obj = new BackendPhpPdo();
        $obj->what = 'PDO_STATEMENT';
        $obj->pdo = $pdo;
        $obj->pdo_statement = $pdo_statement;
        $obj->req = $req;
        $obj->in = $in;
        if(empty($obj->pdo_statement))
            self::getException($obj);
        return $obj;
    }
    public static function getException($message)
    {
        $trace = debug_backtrace();
        if(is_object($message))
        {
            if($message instanceOf Exception)
                $trace = $message->getTrace();
            $message = $message->getMessage();
        }
        $obj = new BackendPhpPdo();
        $obj->what = 'EXCEPTION';
        $obj->message = $message;
        $obj->trace = $trace;
        header("HTTP/1.0 500 Internal Server Error");
        echo $obj->getMessage();
        die();
    }
    public static function getBench($in=NULL,$message='')
    {
        $t = microtime(true);
        if(is_null($in))
            return $t;
        $obj = new BackendPhpPdo();
        $obj->what = 'BENCH';
        $obj->in = $in;
        $obj->out = $t;
        $obj->message = $message;
        self::$benchs[] = $obj;
        return $t;
    }

    # PDO
    public function prepare($req)
    {
        $in = self::getBench();
        $args = func_get_args();
        try {
            $pdo_statement = call_user_func_array(array($this->pdo,'prepare'),$args);
        } catch (Exception $e) {
            self::getException($e);
        }
        return self::getPDOStatement($this->pdo,$pdo_statement,$req,$in);
    }
    public function query($req)
    {
        $in = self::getBench();
        $args = func_get_args();
        try {
            $pdo_statement = call_user_func_array(array($this->pdo,'query'),$args);
        } catch (Exception $e) {
            self::getException($e);
        }
        return self::getPDOStatement($this->pdo,$pdo_statement,$req,$in);
    }
    public static $dones = array();
    public function getClass()
    {
        if(empty(self::$dones))
            require_once(dirname(__FILE__).DIRECTORY_SEPARATOR.'AbstractLayer.php');
        AbstractLayer::$pdo = $this;

        $class = 'Layer'.strtoupper($this->type);
        if(isset(self::$dones[$class]))
            return $class;

        $file = dirname(__FILE__).DIRECTORY_SEPARATOR.$class.'.php';
        if(!file_exists($file))
            self::getException('Layer not implemented : '.$this->type);
        require_once($file);

        self::$dones[$class] = 1;
        return $class;
    }
    public function getLayer()
    {
        $class = $this->getClass();
        $args = func_get_args();
        $method = str_replace(' ','',ucwords(str_replace('-',' ',array_shift($args))));
        if(!method_exists($class,$method))
            self::getException($class.'::'.$method.' not implemented');
        return call_user_func_array(array($class,$method),$args);
    }
    
    # PDO STATEMENT
    public function execute()
    {
        $count = count(explode('?',$this->req))-1;
        if($count != $this->pos)
            self::getException('Not enough or too much bindValue in regards to the number of "?" : '.$this->req.' ('.$this->pos.';'.$count.')');
        $this->pos = 0;
        $args = func_get_args();
        $status = call_user_func_array(array($this->pdo_statement,'execute'),$args);
        self::getBench($this->in,'execute');
        if(!$status)
            self::getException($this);
        return $this;
    }
    public function fetchName()
    {
        $args = func_get_args();
        $args[] = PDO::FETCH_ASSOC;
        $results = call_user_func_array(array($this->pdo_statement,'fetchAll'),$args);
        return $results;
    }
    public function fetchNum()
    {
        $args = func_get_args();
        $args[] = PDO::FETCH_NUM;
        $results = call_user_func_array(array($this->pdo_statement,'fetchAll'),$args);
        return $results;
    }
    public function fetchOne()
    {
        $args = func_get_args();
        $results = call_user_func_array(array($this->pdo_statement,'fetchAll'),$args);
        foreach($results as $k=>$result)
            if(count($result) == 2)
                $results[$k] = $result[0];
        return $results;
    }
    public function fetchAll()
    {
        $args = func_get_args();
        $results = call_user_func_array(array($this->pdo_statement,'fetchAll'),$args);
        self::getBench($this->in,'fetch');
        return $results;
    }
    public function bindValue($value,$type)
    {
        switch($type)
        {
            case 'int': $type = PDO::PARAM_INT; break;
            case 'string': $type = PDO::PARAM_STR; break;
            case 'resource': $type = PDO::PARAM_LOB; break;
            default: self::getException('Unknown type : '.$type); break;
        }
        $this->pdo_statement->bindValue(++$this->pos,$value,$type);
        return $this;
    }

    # General
    public function getMessage()
    {
        switch($this->what)
        {
            case 'EXCEPTION':
                $trace = array();
                foreach($this->trace as $e)
                {
                    if(!isset($e['file'])) $e['file'] = '<i>user_func</i>';
                    if(!isset($e['line'])) $e['line'] = '0';
                    if(!isset($e['class'])) $e['class'] = '';
                    if(!isset($e['type'])) $e['type'] = '';
                    $trace[] = '<small>'.$e['file'].':'.$e['line'].'</small> '.$e['class'].$e['type'].$e['function'];
                }
                return '<strong>'.$this->message.'</strong>'."\n".'<hr />'."\n".implode('<br />'."\n",$trace);
            case 'PDO':
                if(empty($this->pdo))
                    return 'Fail to connect.';
                $error = $this->pdo->errorInfo();
                return $error[0].':'.$error[1].' <pre>'.$error[2].'</pre><pre>'.$this->req.'</pre>';
            case 'PDO_STATEMENT':
                if(empty($this->pdo_statement))
                    $error = $this->pdo->errorInfo();
                else
                    $error = $this->pdo_statement->errorInfo();
                return $error[0].':'.$error[1].' <pre>'.$error[2].'</pre><pre>'.$this->req.'</pre>';
            case 'BENCH':
                return (round(($this->out-$this->in)*1000)/1000).'s '.$this->message;
        }
    }
    public function getTrace()
    {
        switch($this->what)
        {
            case 'EXCEPTION':
                return $this->trace;
            default:
                return array();
        }
    }

    public static function fetchDatatypes($file)
    {
        if(!file_exists($file))
        {
            $header = '<'.'?xml version="1.0" ?'.'>';
            $datatypes = '';
        }
        else
        {
            $datatypes = file($file);
            $header = array_shift($datatypes);
            $datatypes = implode('',$datatypes);
        }
        return array($header,$datatypes);
    }
    public static function buildXML($pdo)
    {
        list($header,$datatypes) = self::fetchDatatypes($pdo->getLayer('datatypes-file'));

        $xml = array();
        $xml[] = $header;
        $xml[] = '<sql db="'.$pdo->type.'">';
        $xml[] = $datatypes;

        $tables = $pdo->getLayer('tables');
        foreach($tables as $table)
        {
            $xmltable = '<table name="'.$table['name'].'">';
            if(!empty($table['comment']))
                $xmltable .= '<comment>'.$table['comment'].'</comment>';

            $columns = $pdo->getLayer('columns',$table);
            foreach($columns as $column)
            {
                $xmlcolumn = '<row name="'.$column['name'].'" null="'.$column['null'].'" autoincrement="'.$column['autoincrement'].'">';
                $xmlcolumn .= '<datatype>'.strtoupper($column['type']).'</datatype>';
                $xmlcolumn .= '<default>'.$column['default'].'</default>';
                if(!empty($column['comment']))
                    $xmlcolumn .= '<comment>'.$column['comment'].'</comment>';

                $relations = $pdo->getLayer('relations',$table,$column);
                foreach($relations as $relation)
                    $xmlcolumn .= '<relation table="'.$relation['table'].'" row="'.$relation['column'].'" />';

                $xmlcolumn .= '</row>';
                $xmltable .= $xmlcolumn;
            }

            $keys = $pdo->getLayer('keys',$table);
            foreach($keys as $name=>$key)
            {
                $xmlkey = '<key name="'.$name.'" type="'.$key['type'].'">';

                foreach($key['columns'] as $column)
                    if(!empty($column))
                        $xmlkey .= '<part>'.$column.'</part>';

                $xmlkey .= '</key>';
                $xmltable .= $xmlkey;
            }

            $xmltable .= '</table>';
            $xml[] = $xmltable;
        }

        $xml[] = '</sql>';

        return implode("\n",$xml);
    }

    public static function actionList()
    {
        list($type,$dsn,$user,$pass,$table) = self::getConfig('saveloadlist');
        $pdo = self::getPdo($type,$dsn,$user,$pass);
        $r = $pdo->getLayer('keywords',$table)->fetchOne();
        foreach($r as $keyword)
            echo $keyword."\n";
    }
    public static function actionSave($key='keyword')
    {
        $keyword = self::req($key);
        $data = file_get_contents("php://input");
        if (get_magic_quotes_gpc() || get_magic_quotes_runtime())
           $data = stripslashes($data);

        list($type,$dsn,$user,$pass,$table) = self::getConfig('saveloadlist');
        $pdo = self::getPdo($type,$dsn,$user,$pass);

        $r = $pdo->getLayer('keywords',$table,$keyword)->fetchOne();
        if(count($r) > 0)
            $pdo->getLayer('keywords-update',$table,$keyword,$data);
        else
            $pdo->getLayer('keywords-insert',$table,$keyword,$data);

        header("HTTP/1.0 201 Created");
    }
    public static function actionLoad($key='keyword')
    {
        $keyword = self::req($key);

        list($type,$dsn,$user,$pass,$table) = self::getConfig('saveloadlist');
        $pdo = self::getPdo($type,$dsn,$user,$pass);

        $r = $pdo->getLayer('keywords',$table,$keyword)->fetchOne();
        if(count($r) > 0)
        {
            header("Content-type: text/xml");
            echo $r[0];
        }
        else
            header("HTTP/1.0 404 Not Found");
        die();
    }
    public static function actionImport()
    {
        ob_start();

        list($type,$dsn,$user,$pass) = self::getConfig('import');
        $pdo = self::getPdo($type,$dsn,$user,$pass);

        $xml = self::buildXML($pdo);

        if(!ob_get_contents())
            header("Content-type: text/xml");
        echo $xml;
        die();
    }

    public static function req($key)
    {
        return isset($_REQUEST[$key])?$_REQUEST[$key]:NULL;
    }
    public static function controler($key='action')
    {
        $action = self::req($key);
        switch(strtolower($action))
        {
            case 'list':
                return self::actionList();
            case 'save':
                return self::actionSave();
            case 'load':
                return self::actionLoad();
            case 'import':
                return self::actionImport();
            default:
                header("HTTP/1.0 501 Not Implemented");
                echo 'Action not implemented';
                die();
        }
    }
}

function bench()
{
    foreach(BackendPhpPdo::$benchs as $bench)
        echo $bench->getMessage().'<br />';
}
//register_shutdown_function('bench');

BackendPhpPdo::controler();

?>
