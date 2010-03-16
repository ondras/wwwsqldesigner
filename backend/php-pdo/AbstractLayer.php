<?php

class AbstractLayer
{

    public static $pdo = NULL;

    # Generic
    public static function protect($value,$alias=NULL) {BackendPhpPdo::getException('Not Implemented');}

    # saveloadlist
    public static function Keywords($table,$keyword='') {BackendPhpPdo::getException('Not Implemented');}
    public static function KeywordsInsert($table,$keyword,$data) {BackendPhpPdo::getException('Not Implemented');}
    public static function KeywordsUpdate($table,$keyword,$data) {BackendPhpPdo::getException('Not Implemented');}

    # datatypes
    public static function DatatypesFile() {BackendPhpPdo::getException('Not Implemented');}

    # model
    public static function Tables() {BackendPhpPdo::getException('Not Implemented');}
    public static function Columns($table) {BackendPhpPdo::getException('Not Implemented');}
    public static function Relations($table,$column) {BackendPhpPdo::getException('Not Implemented');}
    public static function Keys($table) {BackendPhpPdo::getException('Not Implemented');}

}

?>
