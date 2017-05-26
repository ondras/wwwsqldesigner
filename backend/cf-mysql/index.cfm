<cfsetting requesttimeout="60" enablecfoutputonly="yes">

<cfset db = {
	datasource = "wwwsqldesigner",
	table = "wwwsqldesigner",
	
	info_db = "information_schema",
	
	info_databases_table = "schemata",
	info_database_col = "schema_name",
	
	info_tables_table = "tables",
	info_table_col = "table_name",

	info_db_col = "table_schema",

	info_columns_table = "columns",

	info_column_col = "column_name"
}>

<cffunction name="getDatabases">
	<cfquery name="local.databases" datasource="#db.datasource#">
		SELECT *
		FROM #db.info_db#.#db.info_databases_table#
	</cfquery>

	<cfreturn local.databases>
</cffunction>

<cffunction name="getTables">
	<cfargument name="database" default="">

	<cfquery name="local.tables" datasource="#db.datasource#">
		SELECT *
		FROM #db.info_db#.#db.info_tables_table#

		<cfif ARGUMENTS.database NEQ "">
			WHERE #db.info_db_col# = <cfqueryparam cfsqltype="cf_sql_varchar" value="#ARGUMENTS.database#">
		</cfif>
	</cfquery>

	<cfreturn local.tables>
</cffunction>

<cffunction name="getColumns">
	<cfargument name="database">
	<cfargument name="table">

	<cfquery name="local.columns" datasource="#db.datasource#">
		SELECT *
		FROM #db.info_db#.#db.info_columns_table#
		WHERE #db.info_db_col# = <cfqueryparam cfsqltype="cf_sql_varchar" value="#ARGUMENTS.database#">
		AND #db.info_table_col# = <cfqueryparam cfsqltype="cf_sql_varchar" value="#ARGUMENTS.table#">
	</cfquery>

	<cfreturn local.columns>
</cffunction>


<cffunction name="getForeignKeys">
	<cfargument name="database">
	<cfargument name="table">
	<cfargument name="column">

	<cfquery name="local.foreignKeys" datasource="#db.datasource#">
		SELECT REFERENCED_TABLE_NAME AS 'table', REFERENCED_COLUMN_NAME AS 'column'
		FROM #db.info_db#.KEY_COLUMN_USAGE k
		LEFT JOIN #db.info_db#.TABLE_CONSTRAINTS c
			ON k.CONSTRAINT_NAME = c.CONSTRAINT_NAME
		WHERE CONSTRAINT_TYPE = 'FOREIGN KEY'
		AND c.#db.info_db_col# = <cfqueryparam cfsqltype="cf_sql_varchar" value="#ARGUMENTS.database#">
		AND c.#db.info_table_col# = <cfqueryparam cfsqltype="cf_sql_varchar" value="#ARGUMENTS.table#">
		AND k.#db.info_column_col# = <cfqueryparam cfsqltype="cf_sql_varchar" value="#ARGUMENTS.column#">
	</cfquery>

	<cfreturn local.foreignKeys>
</cffunction>

<cffunction name="getKeys">
	<cfargument name="database">
        <cfargument name="table">

	<cfquery name="local.keys" datasource="#db.datasource#">
		SELECT *
		FROM #db.info_db#.STATISTICS
		WHERE #db.info_db_col# = <cfqueryparam cfsqltype="cf_sql_varchar" value="#ARGUMENTS.database#">
                AND #db.info_table_col# = <cfqueryparam cfsqltype="cf_sql_varchar" value="#ARGUMENTS.table#">
		ORDER BY SEQ_IN_INDEX ASC
	</cfquery>

	<cfreturn local.keys>
</cffunction>

<cffunction name="list">
	<cfargument name="database" default="">

	<cfif ARGUMENTS.database EQ "">
		<cfset local.result = getDatabases()>

		<cfreturn valueList(local.result.database_name, chr(10))>
	<cfelse>
		<cfset local.result = getTables(argumentCollection=ARGUMENTS)>

		<cfreturn valueList(local.result.table_name, chr(10))>
	</cfif>
</cffunction>

<cffunction name="isDatabase" returntype="boolean">
	<cfargument name="database">
	<cfset var databases = getDatabases()>

	<cfquery dbtype="query" name="local.databaseCheck">
		SELECT * FROM databases
		WHERE #db.info_database_col# = <cfqueryparam value="#ARGUMENTS.database#" cfsqltype="cf_sql_varchar">
	</cfquery>

	<cfreturn local.databaseCheck.recordCount>
</cffunction>

<cffunction name="import" output="false">
	<cfargument name="database" default="information_schema">

	<cfset var local = {}>

	<cffile action="read" variable="local.datatypes" file="#expandPath("../../db/mysql/datatypes.xml")#">

	<cfset local.arr = listToArray(local.datatypes, "#chr(10)##chr(13)#")>

	<cfset local.xml = "">

	<cfset arrayInsertAt(local.arr, 2, '<sql db="mysql">')>

	<cfif !isDatabase(ARGUMENTS.database)>
		<cfthrow message="Invalid database" detail="Databse `#ARGUMENTS.database#` does not exist on this server.">
	</cfif>

	<cfset local.tables = getTables(ARGUMENTS.database)>

	<cfloop query="local.tables">
		<cfset local.xml &= '<table name="#table_name#">'>

		<cfif table_comment NEQ "">
			<cfset local.xml &= '<comment>#htmlEditFormat(table_comment)#</comment>'>
		</cfif>

		<cfset local.columns = getColumns(database=ARGUMENTS.database, table=table_name)>

		<cfloop query="local.columns">
			<cfif is_nullable EQ "YES">
				<cfset local.null = 1>
			<cfelse>
				<cfset local.null = 0>
			</cfif>

			<cfif findNoCase("auto_increment", extra) GT 0>
				<cfset local.ai = 1>
			<cfelse>
				<cfset local.ai = 0>
			</cfif>			

			<cfset local.def = column_default>

			<cfif local.def EQ "NULL">
				<cfset local.def = "">
			</cfif>

			<cfset local.xml &= '<row name="#column_name#" null="#local.null#" autoincrement="#local.ai#">'>
			<cfset local.xml &= '<datatype>#ucase(column_type)#</datatype>'>
			<cfset local.xml &= '<default>#local.def#</default>'>

			<cfif column_comment NEQ "">
				<cfset local.xml &= '<comment>#htmlEditFormat(column_comment)#</comment>'>
			</cfif>

			<cfset local.fk = getForeignKeys(database=ARGUMENTS.database, table=table_name, column=column_name)>

			<cfloop query="local.fk">
				<cfset local.xml &= '<relation table="#table#" row="#column#" />'>
			</cfloop>

			<cfset local.xml &= '</row>'>
		</cfloop>

		<cfset local.keys = getKeys(database=ARGUMENTS.database, table=table_name)>

		<cfset local.idx = {}>

		<cfloop query="local.keys">
			<cfif structKeyExists(local.idx, index_name)>
				<cfset local.obj = local.idx[index_name]>
			<cfelse>
				<cfset local.t = "INDEX">

				<cfif index_type EQ "FULLTEXT">
					<cfset local.t = index_type>
				</cfif>

				<cfif NON_UNIQUE EQ 0>
					<cfset local.t = "UNIQUE">
				</cfif>

				<cfif index_name EQ "PRIMARY">
					<cfset local.t = "PRIMARY">
				</cfif>

				<cfset local.obj = {
					columns=[],
					type=local.t
				}>

			</cfif>

			<cfset arrayAppend(local.obj["columns"], column_name)>
			<cfset local.idx[index_name] = local.obj>
		</cfloop>

		<cfloop collection="#local.idx#" item="local.name">
			<cfset local.obj = local.idx[local.name]>

			<cfset local.xml &= '<key name="#local.name#" type="#local.obj["type"]#">'>
			
			<cfloop array="#local.obj["columns"]#" index="local.col">
				<cfset local.xml &= '<part>#local.col#</part>'>
			</cfloop>

			<cfset local.xml &= '</key>'>
		</cfloop>
	
		<cfset local.xml &= "</table>">
	</cfloop>

	<cfset arrayAppend(arr, xml)>
	<cfset arrayAppend(arr, '</sql>')>

	<cfreturn arrayToList(arr, chr(10))>
</cffunction>

<cfparam name="URL.action" default="">
<cfset action = URL.action>

<cfswitch expression="#action#">
	<cfcase value="list">
		<cfquery name="result" datasource="#db.datasource#">
			SELECT keyword
			FROM #db.table#
			ORDER BY dt DESC
		</cfquery>
		<cfloop query="result">
			<cfoutput>#keyword##chr(10)#</cfoutput>
		</cfloop>
	</cfcase>
	<cfcase value="save">
		<cfparam name="URL.keyword" default="">
		<cfset keyword = URL.keyword>

		<cfset data = GetHttpRequestData().content>

		<cfquery name="result" datasource="#db.datasource#">
			SELECT *
			FROM #db.table#
			WHERE keyword = <cfqueryparam value="#keyword#" cfsqltype="cf_sql_varchar">
		</cfquery>

		<cfif result.recordCount GT 0>
			<cfquery datasource="#db.datasource#">
				UPDATE #db.table#
				SET data = <cfqueryparam value="#data#" cfsqltype="cf_sql_varchar">
				WHERE keyword = <cfqueryparam value="#keyword#" cfsqltype="cf_sql_varchar">
			</cfquery>
		<cfelse>
			<cfquery datasource="#db.datasource#">
				INSERT INTO #db.table# (keyword, data)
				VALUES (
                                	<cfqueryparam value="#keyword#" cfsqltype="cf_sql_varchar">,
					<cfqueryparam value="#data#" cfsqltype="cf_sql_varchar">
				)
                        </cfquery>
		</cfif>

		<cfheader statuscode="201" statustext="Created">
	</cfcase>
	<cfcase value="load">
		<cfparam name="URL.keyword" default="">
		<cfset keyword = URL.keyword>

		<cfquery name="result" datasource="#db.datasource#">
			SELECT `data`
			FROM #db.table#
			WHERE keyword = <cfqueryparam value="#keyword#" cfsqltype="cf_sql_varchar">
		</cfquery>

		<cfif result.recordCount EQ 0>
		        <cfheader statuscode="404" statustext="Not Found">
			<cfdump var="#result#" abort>
		<cfelse>
			<cfheader name="Content-type" value="text/xml">
		        <cfoutput>#result.data#</cfoutput>
		</cfif>
	</cfcase>
	<cfcase value="import">
		<cfheader name="Content-type" value="text/xml">
		<cfparam name="URL.database" default="">
		<cfoutput>#import(URL.database)#</cfoutput>
	</cfcase>
	<cfdefaultcase>
		<cfheader statuscode="301" statustext="Not Implemented">
	</cfdefaultcase>
</cfswitch>
