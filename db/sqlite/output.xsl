<?xml version="1.0" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method="text"/>
<xsl:template match="/sql">

<!-- tables -->
	<xsl:for-each select="table">
		<xsl:text>CREATE TABLE '</xsl:text>
		<xsl:value-of select="@name" />
		<xsl:text>' (
</xsl:text>
		<xsl:for-each select="row">
			<xsl:variable name="name" select="@name" />

			<xsl:text>'</xsl:text><xsl:value-of select="@name" /><xsl:text>' </xsl:text>
	
			<xsl:value-of select="datatype" />
			
			<xsl:if test="@null = 0">
				<xsl:text> NOT NULL </xsl:text>
			</xsl:if> 
			

			<xsl:if test="default">
				<xsl:text> DEFAULT </xsl:text>
				<xsl:value-of select="default" />
			</xsl:if>
			
			<!-- autoincrement/primary key after column - only when composed of 1 part -->
			<xsl:for-each select="../key">
				<xsl:if test="@type = 'PRIMARY' and count(child::part) = 1">
					<xsl:for-each select="part">
						<xsl:if test="$name = .">
							<xsl:text> PRIMARY KEY</xsl:text>
						</xsl:if>
					</xsl:for-each>
				</xsl:if>
			</xsl:for-each>

			<xsl:if test="@autoincrement = 1">
				<xsl:text> AUTOINCREMENT</xsl:text>
			</xsl:if> 

			<!-- fk -->
			<xsl:for-each select="relation">
				<xsl:text> REFERENCES '</xsl:text>
				<xsl:value-of select="@table" />
				<xsl:text>' ('</xsl:text>
				<xsl:value-of select="@row" />
				<xsl:text>')</xsl:text>
			</xsl:for-each>

			<xsl:if test="not (position()=last())">
				<xsl:text>,
</xsl:text>
			</xsl:if> 
		</xsl:for-each>
		
		<!-- keys after table -->
		<xsl:for-each select="key">
			<xsl:if test="@type = 'UNIQUE' or (@type = 'PRIMARY' and count(child::part) &gt; 1)">
				<xsl:text>,
</xsl:text>
				<xsl:text>UNIQUE (</xsl:text>
				
				<xsl:for-each select="part">
					<xsl:value-of select="." />
					<xsl:if test="not (position() = last())">
						<xsl:text>, </xsl:text>
					</xsl:if>
				</xsl:for-each>
				<xsl:text>)</xsl:text>
			</xsl:if>
			
		</xsl:for-each>
		
		<xsl:text>
);

</xsl:text>

	</xsl:for-each>

	<xsl:for-each select="table">
		<xsl:for-each select="key">
			<xsl:if test="@type = 'INDEX'">
				<xsl:text>CREATE INDEX '</xsl:text>
				<xsl:value-of select="@name" />
				<xsl:text>' ON '</xsl:text>
				<xsl:value-of select="../@name" />
				<xsl:text>' ('</xsl:text>
				<xsl:for-each select="part">
					<xsl:value-of select="." />
					<xsl:if test="not (position() = last())">
						<xsl:text>', '</xsl:text>
					</xsl:if>
				</xsl:for-each>
				<xsl:text>');
</xsl:text>
			</xsl:if>
		</xsl:for-each>
	</xsl:for-each>

</xsl:template>
</xsl:stylesheet>
