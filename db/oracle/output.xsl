<?xml version="1.0" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<!-- Define which symbol to use for quoting identifiers, may be empty -->
<xsl:variable name="quote">"</xsl:variable>

<!-- Predefine useful global variables -->
<xsl:variable name="apos" >'</xsl:variable>
<xsl:variable name="crlf" ><xsl:text>
</xsl:text></xsl:variable>
<!--                                       |"MAXIMUM_ORACLE_COLUMN_NAME_LEN"| -->
<xsl:variable name="padding_name"><xsl:text>                                </xsl:text></xsl:variable>
<!--                                       |VARCHAR2(4000 CHAR) |             -->
<xsl:variable name="padding_type"><xsl:text>                    </xsl:text></xsl:variable>
<xsl:variable name="smallcase" select="'abcdefghijklmnopqrstuvwxyz'" />
<xsl:variable name="uppercase" select="'ABCDEFGHIJKLMNOPQRSTUVWXYZ'" />

<xsl:output method="text"/>

<!-- Quotes oracle identifier, if required (if it contains non-uppercase letters)-->
<xsl:template name="ora_ident">
	<xsl:param name="ident"/>
	<xsl:choose>
		<xsl:when test="translate( $ident, $smallcase, $uppercase ) = $ident">
			<xsl:value-of select="$ident" />
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="concat( $quote, $ident, $quote )"/>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<!-- Constructs FK constraint name from 2 table names, fitted into 30 symbols per identifier limitation -->
<xsl:template name="ora_fk_constraint_name">
	<xsl:param name="tbl_fr"/>
	<xsl:param name="tbl_to"/>
	<xsl:call-template name="ora_ident">
		<xsl:with-param name="ident" select="concat( 'FK_',  substring( $tbl_fr, 1 + string-length( $tbl_fr ) - ( 30 - 4 ) div 2 )
		                                           , '_',    substring( $tbl_to, 1 + string-length( $tbl_to ) - ( 30 - 4 ) div 2 ) )" />
	</xsl:call-template>
</xsl:template>

<xsl:template name="replace-substring">
	<xsl:param name="value" />
	<xsl:param name="from" />
	<xsl:param name="to" />
	<xsl:choose>
		<xsl:when test="contains($value,$from)">
			<xsl:value-of select="substring-before($value,$from)" />
			<xsl:value-of select="$to" />
			<xsl:call-template name="replace-substring">
				<xsl:with-param name="value" select="substring-after($value,$from)" />
				<xsl:with-param name="from" select="$from" />
				<xsl:with-param name="to" select="$to" />
			</xsl:call-template>
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="$value" />
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>


<xsl:template match="/sql">

<!-- Generate commented DROPs for same objects that later would be created. This is useful when re-creating DB schema. -->
	<xsl:if test="0 &lt; count( table )">
		<xsl:value-of select="concat( $crlf, '/*' )"/>
		<xsl:for-each select="table">
			<xsl:variable name="tbl_fr" select="@name" />
			<xsl:for-each select="row">
				<xsl:for-each select="relation">
					<xsl:variable name="tbl_to" select="@table" />
					<xsl:value-of select="concat( $crlf, 'ALTER TABLE ', '' )"/>
					<xsl:call-template name="ora_ident">
						<xsl:with-param name="ident" select="$tbl_fr" />
					</xsl:call-template>
					<xsl:value-of select="concat( ' DROP CONSTRAINT ', '' )"/>
					<xsl:call-template name="ora_fk_constraint_name">
						<xsl:with-param name="tbl_fr" select="$tbl_fr" />
						<xsl:with-param name="tbl_to" select="$tbl_to" />
					</xsl:call-template>
					<xsl:value-of select="concat( ';', '' )"/>
				</xsl:for-each>
			</xsl:for-each>
		</xsl:for-each>

		<xsl:for-each select="table">
			<xsl:variable name="table" select="@name" />
			<xsl:value-of select="concat( $crlf, 'DROP TABLE ' )" />
			<xsl:call-template name="ora_ident">
				<xsl:with-param name="ident" select="$table" />
			</xsl:call-template>
			<xsl:value-of select="concat( ' PURGE;', '' )" />
			<xsl:if test="0 &lt; count( row[@autoincrement = 1] )">
				<xsl:for-each select="row[@autoincrement = 1]">
					<xsl:value-of select="concat( $crlf, 'DROP SEQUENCE ' )"/>
					<xsl:call-template name="ora_ident">
						<xsl:with-param name="ident" select="concat( 'SQ_', $table )" />
					</xsl:call-template>
					<xsl:value-of select="concat( ';', '' )"/>
				</xsl:for-each>
			</xsl:if>
		</xsl:for-each>

		<xsl:value-of select="concat( $crlf, '-- */' )"/>
	</xsl:if>

<!-- tables -->
	<xsl:for-each select="table">
		<xsl:variable name="table" select="@name" />
		<xsl:value-of select="concat( $crlf, '' )" />
		<xsl:value-of select="concat( $crlf, '-------------------------------------------------------------------------------' )" />
		<xsl:value-of select="concat( $crlf, '--            ', $table )" />
		<xsl:value-of select="concat( $crlf, '-------------------------------------------------------------------------------' )" />
		<xsl:value-of select="concat( $crlf, '' )" />
		<xsl:value-of select="concat( $crlf, 'CREATE TABLE ' )" />
		<xsl:call-template name="ora_ident">
			<xsl:with-param name="ident" select="$table" />
		</xsl:call-template>
		<xsl:value-of select="concat( ' (', '' )" />
		<xsl:for-each select="row">
			<xsl:if test="position()=1">
				<xsl:value-of select="concat( $crlf, '    ' )" />
			</xsl:if>
			<xsl:if test="not (position()=1)">
				<xsl:value-of select="concat( $crlf, '  , ' )" />
			</xsl:if>
			<xsl:call-template name="ora_ident">
				<xsl:with-param name="ident" select="@name" />
			</xsl:call-template>

			<xsl:value-of select="concat( substring( $padding_name, 1, string-length( $padding_name ) - string-length( @name ) )
			                            , datatype )" />
			
			<xsl:if test="default and not ( default = 'NULL' )">
				<xsl:value-of select="concat( substring( $padding_type, 1, string-length( $padding_type ) - string-length( datatype ) )
				                            , 'DEFAULT ', default )" />
			</xsl:if>

			<xsl:if test="@null = 0">
				<xsl:value-of select="concat( substring( $padding_type, 1, string-length( $padding_type ) - string-length( datatype ) )
				                            , 'NOT NULL' )" />
			</xsl:if>

		</xsl:for-each>
		
<!-- keys -->
		<xsl:for-each select="key">
			<xsl:value-of select="concat( $crlf, '  , CONSTRAINT ' )" />
			<xsl:if test="@name">
				<!-- if KEY constraint name was specified - use it -->
				<xsl:call-template name="ora_ident">
					<xsl:with-param name="ident" select="@name" />
				</xsl:call-template>
			</xsl:if>
			<xsl:choose>
				<xsl:when test="@type = 'PRIMARY'" >
					<xsl:if test="@name = ''">
						<!-- if PK KEY constraint name was NOT specified - invent it -->
						<xsl:call-template name="ora_ident">
							<xsl:with-param name="ident" select="concat( 'PK_', ../@name )" />
						</xsl:call-template>
					</xsl:if>
					<xsl:value-of select="concat( ' PRIMARY KEY', '' )" />
				</xsl:when>
				<xsl:when test="@type = 'UNIQUE'" >
					<xsl:if test="@name = ''">
						<!-- if QU KEY constraint name was NOT specified - invent it -->
						<xsl:call-template name="ora_ident">
							<xsl:with-param name="ident" select="concat( 'UQ_', position() )" />
						</xsl:call-template>
					</xsl:if>
					<xsl:value-of select="concat( ' UNIQUE', '' )" />
				</xsl:when>
				<xsl:otherwise>
						<!-- if other? KEY constraint name was NOT specified - invent it -->
					<xsl:if test="@name = ''">
						<xsl:call-template name="ora_ident">
							<xsl:with-param name="ident" select="concat( 'KK_', position() )" />
						</xsl:call-template>
					</xsl:if>
					<xsl:value-of select="concat( ' ??',  @type, '??' )" />
				</xsl:otherwise>
			</xsl:choose>

			<!-- comma -separated list of columns -->
			<xsl:text> ( </xsl:text>
			<xsl:for-each select="part">
				<xsl:call-template name="ora_ident">
					<xsl:with-param name="ident" select="." />
				</xsl:call-template>
				<xsl:if test="not (position() = last())">
					<xsl:text>, </xsl:text>
				</xsl:if>
			</xsl:for-each>
			<xsl:text> )</xsl:text>
		</xsl:for-each>
		
		<xsl:text>
);
</xsl:text>

		<xsl:if test="comment">
			<xsl:value-of select="concat( $crlf, 'COMMENT ON TABLE  ' )"/>
			<xsl:call-template name="ora_ident">
				<xsl:with-param name="ident" select="@name" />
			</xsl:call-template>
			<xsl:value-of select="concat( $padding_name, ' IS ', $apos )"/>
			<xsl:call-template name="replace-substring">
				<xsl:with-param name="value" select="comment" />
				<xsl:with-param name="from" select='"&apos;"' />
				<xsl:with-param name="to" select='"&apos;&apos;"' />
			</xsl:call-template>
			<xsl:value-of select="concat( $apos, ';' )"/>
		</xsl:if>
		
		<xsl:for-each select="row">
			<xsl:if test="comment">
				<xsl:value-of select="concat( $crlf, 'COMMENT ON COLUMN ' )"/>
				<xsl:call-template name="ora_ident">
					<xsl:with-param name="ident" select="$table" />
				</xsl:call-template>
				<xsl:value-of select="concat( '.', '' )"/>
				<xsl:call-template name="ora_ident">
					<xsl:with-param name="ident" select="@name" />
				</xsl:call-template>
				<xsl:value-of select="concat( substring( $padding_name, 1, string-length( $padding_name ) - string-length( @name ) )
				                            , 'IS ', $apos )"/>
				<xsl:call-template name="replace-substring">
					<xsl:with-param name="value" select="comment" />
					<xsl:with-param name="from" select='"&apos;"' />
					<xsl:with-param name="to" select='"&apos;&apos;"' />
				</xsl:call-template>
				<xsl:value-of select="concat( $apos, ';' )"/>
			</xsl:if>
		</xsl:for-each>
		
		<xsl:if test="0 &lt; count( row[@autoincrement = 1] )">
			<xsl:value-of select="concat( $crlf, '' )"/>
<!-- create auto increment sequence -->
			<xsl:for-each select="row[@autoincrement = 1]">
				<xsl:value-of select="concat( $crlf, 'CREATE SEQUENCE ' )"/>
				<xsl:call-template name="ora_ident">
					<xsl:with-param name="ident" select="concat( 'SQ_', $table )" />
				</xsl:call-template>
				<xsl:value-of select="concat( ';', '' )"/>
			</xsl:for-each>

<!-- create auto increment trigger -->
			<xsl:value-of select="concat( $crlf, '' )"/>
			<xsl:value-of select="concat( $crlf, 'CREATE OR REPLACE TRIGGER ' )"/>
			<xsl:call-template name="ora_ident">
				<xsl:with-param name="ident" select="concat( 'TG_', $table, '_BI' )" />
			</xsl:call-template>
			<xsl:value-of select="concat( $crlf, '    BEFORE INSERT ON ' )"/>
			<xsl:call-template name="ora_ident">
				<xsl:with-param name="ident" select="$table" />
			</xsl:call-template>
			<xsl:value-of select="concat( $crlf, '    FOR EACH ROW' )"/>
			<xsl:value-of select="concat( $crlf, 'BEGIN' )"/>
			<xsl:for-each select="row[@autoincrement = 1]">
				<xsl:value-of select="concat( $crlf, '    if :NEW.' )"/>
				<xsl:call-template name="ora_ident">
					<xsl:with-param name="ident" select="@name" />
				</xsl:call-template>
				<xsl:value-of select="concat( ' is NULL then', '' )"/>
				<xsl:value-of select="concat( $crlf, '        :NEW.' )"/>
				<xsl:call-template name="ora_ident">
					<xsl:with-param name="ident" select="@name" />
				</xsl:call-template>
				<xsl:value-of select="concat( ' := ', '' )"/>
				<xsl:call-template name="ora_ident">
					<xsl:with-param name="ident" select="concat( 'SQ_', $table )" />
				</xsl:call-template>
				<xsl:value-of select="concat( '.nextVal;', '' )"/>
				<xsl:value-of select="concat( $crlf, '    end if;' )"/>
			</xsl:for-each>
			<xsl:value-of select="concat( $crlf, 'END;' )"/>
			<xsl:value-of select="concat( $crlf, '/' )"/>
			<xsl:value-of select="concat( $crlf, '' )"/>
			<xsl:value-of select="concat( $crlf, 'SHOW ERRORS;' )"/>
		</xsl:if>

	</xsl:for-each>

<!-- Generate all FKs in the end - when all tables are present -->
	<xsl:if test="0 &lt; count( table/row/relation )">
		<xsl:value-of select="concat( $crlf, '' )" />
		<xsl:value-of select="concat( $crlf, '-------------------------------------------------------------------------------' )" />
		<xsl:value-of select="concat( $crlf, '' )" />
	</xsl:if>
	<xsl:for-each select="table/row/relation/../.."> <!--  loop through tables which have relations -->
		<xsl:variable name="tbl_fr" select="@name" />
<!-- This is a straight-forward algorithm: each <relation> produces one ALTER TABLE statement -->
		<xsl:for-each select="row">
			<xsl:for-each select="relation">
				<xsl:variable name="tbl_to" select="@table" />
				<xsl:value-of select="concat( $crlf, 'ALTER TABLE ' )"/>
				<xsl:call-template name="ora_ident">
					<xsl:with-param name="ident" select="$tbl_fr" />
				</xsl:call-template>
				<xsl:value-of select="concat( ' ADD CONSTRAINT ', '' )"/>
				<xsl:call-template name="ora_fk_constraint_name">
					<xsl:with-param name="tbl_fr" select="$tbl_fr" />
					<xsl:with-param name="tbl_to" select="$tbl_to" />
				</xsl:call-template>
				<xsl:value-of select="concat( ' FOREIGN KEY ( ', '' )"/>
				<xsl:call-template name="ora_ident">
					<xsl:with-param name="ident" select="../@name" />
				</xsl:call-template>
				<xsl:value-of select="concat( ' ) REFERENCES ', '' )"/>
				<xsl:call-template name="ora_ident">
					<xsl:with-param name="ident" select="$tbl_to" />
				</xsl:call-template>
				<xsl:value-of select="concat( ' ( ', '' )"/>
				<xsl:call-template name="ora_ident">
					<xsl:with-param name="ident" select="@row" />
				</xsl:call-template>
				<xsl:value-of select="concat( ' );', '' )"/>
			</xsl:for-each>
		</xsl:for-each>
<!-- @TODO: While it seems that XML DB model would contain several <relation>-s for FK constraints which use compound keys: one <relation> per column -->
	</xsl:for-each>

</xsl:template>
</xsl:stylesheet>
