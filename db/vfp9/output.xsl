<?xml version="1.0" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method="text"/>

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


<!-- parameters/setting -->
	<xsl:text>LPARAMETERS teLongName, tcCommand, tcPath
</xsl:text>
		<xsl:text>* [teLongName] False: set llDbc=.F. and generates "FREE", Empty: generates without "FREE" and "NAME", otherwise generates "NAME teLongName"
</xsl:text>
		<xsl:text>* [tcCommand] if used, &amp;tcCommand command will run after CREATE TABLE, f.e. "= MyProc( ALIAS(), m.lcTableComment, @lacComments )"
</xsl:text>
		<xsl:text>* [tcPath] path where tables will be created (if not used, tables will be created in current folder)

</xsl:text>
	<xsl:text>LOCAL ARRAY lacComments[1,2]
</xsl:text>
	<xsl:text>LOCAL llDbc, lcFreeOrName, lcTableComment
</xsl:text>
	<xsl:text>llDbc = VARTYPE( m.teLongName )=[C]
</xsl:text>
	<xsl:text>	* no special support for llDbc=True yet (you could improve db\vfp9\output.xsl and remove "xsl:if test=[1=2]" from it)
</xsl:text>
	<xsl:text>lcFreeOrName = IIF( m.llDbc, IIF( EMPTY( m.teLongName ), [], [NAME "] + m.teLongName + ["] ), [FREE] )
</xsl:text>
	<xsl:text>tcPath = IIF( VARTYPE( m.tcPath )=[L], [], ADDBS( m.tcPath ) )
</xsl:text>
	<xsl:text>
</xsl:text>


<!-- tables -->
	<xsl:for-each select="table">
		<xsl:text>ERASE '</xsl:text>
		<xsl:value-of select="@name" />
		<xsl:text>.dbf'</xsl:text>
		<xsl:text>
</xsl:text>
		<xsl:text>ERASE '</xsl:text>
		<xsl:value-of select="@name" />
		<xsl:text>.fpt'</xsl:text>
		<xsl:text>
</xsl:text>
		<xsl:text>ERASE '</xsl:text>
		<xsl:value-of select="@name" />
		<xsl:text>.cdx'</xsl:text>
		<xsl:text>
</xsl:text>
		<xsl:text>ERASE '</xsl:text>
		<xsl:value-of select="@name" />
		<xsl:text>.bak'</xsl:text>
		<xsl:text>
</xsl:text>
		<xsl:text>ERASE '</xsl:text>
		<xsl:value-of select="@name" />
		<xsl:text>.tbk'</xsl:text>
		<xsl:text>

</xsl:text>

		<xsl:text>CREATE TABLE (m.tcPath + '</xsl:text>
		<xsl:value-of select="@name" />
		<xsl:text>') &amp;lcFreeOrName</xsl:text>
		<xsl:text> ( ;
</xsl:text>
		<xsl:for-each select="row">
			<xsl:text></xsl:text>
			<xsl:value-of select="@name" />
			<xsl:text> </xsl:text>

			<xsl:value-of select="datatype" />
			<xsl:text> </xsl:text>
			
			<xsl:if test="@null = 0">
				<xsl:text>NOT NULL </xsl:text>
			</xsl:if> 
			<xsl:if test="@null = 1">
				<xsl:text>NULL </xsl:text>
			</xsl:if> 
			
			<xsl:if test="@autoincrement = 1">
				<xsl:text>AutoInc </xsl:text>
			</xsl:if> 

			<xsl:if test="default">
				<!-- VFP9 Support DEFAULT.., NOCPTRANS, ..<xsl:text>DEFAULT </xsl:text> -->
				<xsl:variable name="cdefault" select="default"/>
				<xsl:value-of select="substring($cdefault,2,string-length($cdefault)-2)" />
				<xsl:text> </xsl:text>
			</xsl:if>

<xsl:if test="1=2"> <!-- VFP9 no .dbc support yet -->
			<xsl:if test="comment">
				<xsl:text>COMMENT '</xsl:text>
				<xsl:call-template name="replace-substring">
					<xsl:with-param name="value" select="comment" />
					<xsl:with-param name="from" select='"&apos;"' />
					<xsl:with-param name="to" select='"&apos;&apos;"' />
				</xsl:call-template>
				<xsl:text>' </xsl:text>
			</xsl:if>
</xsl:if> <!-- VFP9 no .dbc support yet -->

			<xsl:if test="not (position()=last())">
				<xsl:text>, ;
</xsl:text>
			</xsl:if> 
			<xsl:if test="position()=last()">
				<xsl:text> ;
</xsl:text>
			</xsl:if> 
		</xsl:for-each>
		
<!-- keys -->
<xsl:if test="1=2"> <!-- VFP9 no .dbc support yet -->
		<xsl:for-each select="key">
			<xsl:text>,
</xsl:text>
			<xsl:choose>
				<xsl:when test="@type = 'PRIMARY'">PRIMARY KEY (</xsl:when>
				<xsl:when test="@type = 'FULLTEXT'">FULLTEXT KEY (</xsl:when>
				<xsl:when test="@type = 'UNIQUE'">UNIQUE KEY (</xsl:when>
				<xsl:otherwise>KEY (</xsl:otherwise>
			</xsl:choose>
			
			<xsl:for-each select="part">
				<xsl:text></xsl:text><xsl:value-of select="." /><xsl:text></xsl:text>
				<xsl:if test="not (position() = last())">
					<xsl:text>, </xsl:text>
				</xsl:if>
			</xsl:for-each>
			<xsl:text>)</xsl:text>
			
		</xsl:for-each>

</xsl:if> <!-- VFP9 no .dbc support yet -->
		<xsl:text>)

</xsl:text>
		<xsl:text>lcTableComment = '</xsl:text>
		<xsl:call-template name="replace-substring">
			<xsl:with-param name="value" select="comment" />
			<xsl:with-param name="from" select='"&apos;"' />
			<xsl:with-param name="to" select='"&apos;&apos;"' />
		</xsl:call-template>
		<xsl:text>'
</xsl:text>


<!-- VFP9 call command/function after table was created -->
		<xsl:text>DIMENSION lacComments[FCOUNT(),2]
</xsl:text>
		<xsl:for-each select="row">
			<xsl:text>	lacComments[</xsl:text>
			<xsl:value-of select="position()" />
			<xsl:text>,1] = '</xsl:text>
			<xsl:value-of select="@name" />
			<xsl:text>'
</xsl:text>
			<xsl:text>	lacComments[</xsl:text>
			<xsl:value-of select="position()" />
			<xsl:text>,2] = '</xsl:text>
			<xsl:call-template name="replace-substring">
				<xsl:with-param name="value" select="comment" />
				<xsl:with-param name="from" select='"&apos;"' />
				<xsl:with-param name="to" select='"&apos;&apos;"' />
			</xsl:call-template>
			<xsl:text>'
</xsl:text>
		</xsl:for-each>
		<xsl:text>
</xsl:text>
		<xsl:text>IF NOT EMPTY( m.tcCommand )
</xsl:text>
		<xsl:text>	&amp;tcCommand
</xsl:text>
		<xsl:text>ENDIF

</xsl:text>
<!-- VFP9 call command/function after table was created finished -->


	</xsl:for-each>

<!-- fk -->
<xsl:if test="1=2"> <!-- VFP9 no .dbc support yet -->
	<xsl:for-each select="table">
		<xsl:for-each select="row">
			<xsl:for-each select="relation">
				<xsl:text>ALTER TABLE </xsl:text>
				<xsl:value-of select="../../@name" />
				<xsl:text> ADD FOREIGN KEY (</xsl:text>
				<xsl:value-of select="../@name" />
				<xsl:text>) REFERENCES </xsl:text>
				<xsl:value-of select="@table" />
				<xsl:text> (</xsl:text>
				<xsl:value-of select="@row" />
				<xsl:text>);
</xsl:text>
			</xsl:for-each>
		</xsl:for-each>
	</xsl:for-each>
</xsl:if> <!-- VFP9 no .dbc support yet -->


</xsl:template>
</xsl:stylesheet>
