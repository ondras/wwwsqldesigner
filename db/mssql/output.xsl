<?xml version="1.0" encoding="UTF-8"?>
<!--
	XML 2 MsSQL XSL transformation for WWW SQL Designer v 2.x
	Version: 0.2
	Author: peter@pcurd.co.uk (Peter) 17/03/2009
	Author: schliden@gmail.com
-->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method="text"/>
<xsl:template match="/sql">

<!-- tables -->
	<xsl:for-each select="table">
		<xsl:text>CREATE TABLE [</xsl:text>
		<xsl:value-of select="@name"/>
		<xsl:text>] (
</xsl:text>
		<xsl:for-each select="row">
			<xsl:text>  [</xsl:text>
			<xsl:value-of select="@name"/>
			<xsl:text>] </xsl:text>

			<xsl:value-of select="datatype"/>
			<xsl:text> </xsl:text>

			<xsl:if test="@null = 0">
				<xsl:text>NOT NULL </xsl:text>
			</xsl:if>

			<xsl:if test="@autoincrement = 1">
				<xsl:text>IDENTITY (1, 1) </xsl:text>
			</xsl:if>

			<xsl:if test="not (position()=last())">
				<xsl:text>,</xsl:text>
			</xsl:if>

			<xsl:if test="comment">
				<xsl:text> -- </xsl:text><xsl:value-of select="comment"/>
			</xsl:if>

			<xsl:if test="not (position()=last())">
				<xsl:text>
</xsl:text>
			</xsl:if>
		</xsl:for-each>

		
		<xsl:for-each select="key">
			<xsl:if test="@type = 'PRIMARY' or @type = 'FULLTEXT' or @type = 'UNIQUE'"> 
				<xsl:text>, 
</xsl:text>
				
				<xsl:if test="not (@name='')"> 
					<xsl:text>CONSTRAINT </xsl:text>
					<xsl:value-of select="@name"/> 
				</xsl:if>
				<xsl:choose>
					<xsl:when test="@type = 'PRIMARY'"> PRIMARY KEY (</xsl:when>
					<xsl:when test="@type = 'FULLTEXT'"> FULLTEXT KEY (</xsl:when>
					<xsl:when test="@type = 'UNIQUE'"> UNIQUE KEY (</xsl:when>
				<!--	<xsl:otherwise>KEY (</xsl:otherwise> --> <!-- No otherwise for MSSQL -->
				</xsl:choose>
				
				<!-- MSSQL only recognises these 'key' types -->

				
					<xsl:for-each select="part">
						<xsl:text>[</xsl:text><xsl:value-of select="."/><xsl:text>]</xsl:text>
						<xsl:if test="not (position() = last())">
							<xsl:text>, </xsl:text>
						</xsl:if>
					</xsl:for-each>
					<xsl:text>)</xsl:text>
			</xsl:if>
			
			
		</xsl:for-each>
		
		
		
		
		<xsl:text>
) ON [PRIMARY]
GO

</xsl:text>

	</xsl:for-each>	
<!-- fk -->
	<xsl:for-each select="table">
		<xsl:for-each select="row">
			<xsl:for-each select="relation">
				<xsl:text>ALTER TABLE [</xsl:text>
				<xsl:value-of select="../../@name"/>
				<xsl:text>] ADD FOREIGN KEY (</xsl:text>
				<xsl:value-of select="../@name"/>
				<xsl:text>) REFERENCES [</xsl:text>
				<xsl:value-of select="@table"/>
				<xsl:text>] ([</xsl:text>
				<xsl:value-of select="@row"/>
				<xsl:text>]);
				
</xsl:text>
			</xsl:for-each>
		</xsl:for-each>
	</xsl:for-each>
	
	<!-- fk -->
	<xsl:for-each select="table">
		<xsl:for-each select="key">
			<xsl:if test="@type = 'INDEX'">
				<xsl:text>CREATE INDEX </xsl:text>
				<xsl:value-of select="@name"/>
				<xsl:text> ON [</xsl:text>
				<xsl:value-of select="../@name"/>
				<xsl:text>] ([</xsl:text>
				<xsl:for-each select="part">
					<xsl:value-of select="."/>
					<xsl:text>]</xsl:text>
					<xsl:if test="not (position() = last())">
						<xsl:text>, </xsl:text>
					</xsl:if>
				</xsl:for-each>
				<xsl:text>);
</xsl:text>
			</xsl:if>
		</xsl:for-each>
	</xsl:for-each>


</xsl:template>
</xsl:stylesheet>