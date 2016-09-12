<?xml version="1.0" encoding="us-ascii"?>
<!-- License public domain  -->
<!-- Created by Boris Manojlovic <boris DOT manojlovic AT steki DOT net>  -->
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
	<xsl:output method="text"/>
	<xsl:template name="replace-substring">
		<xsl:param name="value"/>
		<xsl:param name="from"/>
		<xsl:param name="to"/>
		<xsl:choose>
			<xsl:when test="contains($value,$from)">
				<xsl:value-of select="substring-before($value,$from)"/>
				<xsl:value-of select="$to"/>
				<xsl:call-template name="replace-substring">
					<xsl:with-param name="value" select="substring-after($value,$from)"/>
					<xsl:with-param name="from" select="$from"/>
					<xsl:with-param name="to" select="$to"/>
				</xsl:call-template>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$value"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	<!-- return length of element-->
	<xsl:template name="getsize">
		<xsl:param name="invalue"/>
		<xsl:choose>
			<xsl:when test="contains($invalue,'(')">
				<xsl:variable name="part" select="substring-after($invalue,'(')"/>
				<xsl:value-of select="substring-before($part,')')"/>
			</xsl:when>
		</xsl:choose>
	</xsl:template>
	<!-- return web2py python representation of table -->
	<xsl:template name="tableparser">
		<xsl:param name="tabledata"/>
		<xsl:text>dbOBJECT.define_table("</xsl:text>
		<xsl:value-of select="@name"/>
		<xsl:text>",</xsl:text>
		<xsl:for-each select="row">
			<xsl:variable name="row"><xsl:value-of select="@name" /></xsl:variable>
			<xsl:choose>
				<!-- ignore id fields as web2py needs it for building relations and will create them automatically -->
				<xsl:when test="not(@name = 'id')">
					<xsl:text>&#xa;    Field("</xsl:text>
					<xsl:value-of select="@name"/>
					<xsl:text>"</xsl:text>
					<xsl:choose>
						<xsl:when test="not (relation)">
							<xsl:text>, </xsl:text>
							<xsl:choose>
								<xsl:when test="contains(datatype,'(')">
									<xsl:text>"</xsl:text>
									<xsl:value-of select="substring-before(datatype,'(')"/>
									<xsl:text>", length=</xsl:text>
									<xsl:call-template name="getsize">
										<xsl:with-param name="invalue" select="datatype"/>
									</xsl:call-template>
									<xsl:text>, </xsl:text>
								</xsl:when>
								<xsl:otherwise>
									<xsl:text>"</xsl:text>
									<xsl:value-of select="datatype"/>
									<xsl:text>", </xsl:text>
								</xsl:otherwise>
							</xsl:choose>
							<xsl:if test="@null = 0">
								<xsl:text>notnull=True, </xsl:text>
							</xsl:if>
							<xsl:choose>
								<xsl:when test="default">
									<xsl:text>default=</xsl:text>
									<xsl:choose>
										<xsl:when test="default = 'NULL'">
											<xsl:text>None</xsl:text>
										</xsl:when>
										<xsl:otherwise>
											<xsl:value-of select="default"/>
										</xsl:otherwise>
									</xsl:choose>
								</xsl:when>
								<xsl:otherwise>
									<xsl:text>default=None</xsl:text>
								</xsl:otherwise>
							</xsl:choose>
						</xsl:when>
						<xsl:otherwise>
							<xsl:text>, "reference </xsl:text>
							<xsl:for-each select="relation">
								<xsl:value-of select="@table"/>
							</xsl:for-each>
							<xsl:text>"</xsl:text>
						</xsl:otherwise>
					</xsl:choose>

					<!-- keys -->
					<xsl:for-each select="../key[@type='UNIQUE']/part">
						<xsl:if test="text() = $row">, unique=True</xsl:if>
					</xsl:for-each>

					<xsl:text>)</xsl:text>
				</xsl:when>
			</xsl:choose>
			<xsl:if test="not (position()=last())">
				<xsl:if test="not (@name = 'id')">
					<xsl:text>,</xsl:text>
				</xsl:if>
			</xsl:if>
		</xsl:for-each>

		<xsl:text>)</xsl:text>
		<xsl:text>&#xa;&#xa;</xsl:text>

	</xsl:template>
	<!-- parsing db xml file -->
	<xsl:template match="/sql">
		<xsl:text>""" database class object creation (initialization) """&#xa;</xsl:text>
		<xsl:text>if request.env.web2py_runtime_gae:                  # if running on Google App Engine &#xa;</xsl:text>
		<xsl:text>    dbOBJECT = DAL('gae')                           # connect to Google BigTable &#xa;</xsl:text>
		<xsl:text>    session.connect(request, response, db=dbOBJECT) # and store sessions and tickets there &#xa;</xsl:text>
		<xsl:text>else:                                               # else use a normal relational database &#xa;</xsl:text>
		<xsl:text>    dbOBJECT = DAL("sqlite://dbOBJECT.db")&#xa;&#xa;</xsl:text>
		<!-- doing two pass: first ignore tables with relations as they will raise exception if table referenced still does not exist (not instantiated) -->
		<!-- this is not bullet proff but should be sufficient for small projects will be in TODO :) -->
		<xsl:for-each select="table">
			<xsl:if test="not (row/relation)">
				<xsl:call-template name="tableparser">
					<xsl:with-param name="tabledata" select="table"/>
				</xsl:call-template>
			</xsl:if>
		</xsl:for-each>
		<!-- calling second pass ignore non relation tables -->
		<xsl:for-each select="table">
			<xsl:if test="row/relation">
				<xsl:call-template name="tableparser">
					<xsl:with-param name="tabledata" select="table"/>
				</xsl:call-template>
			</xsl:if>
		</xsl:for-each>
		<!-- end of for-each select="table" -->
		<!-- fk -->
		<xsl:text>""" Relations between tables (remove fields you don't need from requires) """&#xa;</xsl:text>
		<!-- dbOBJECT.druga.prva_id.requires=IS_IN_DB(db, 'auth_user.id','%(id)s: %(first_name)s %(last_name)s') -->
		<xsl:for-each select="table">
			<xsl:for-each select="row">
				<xsl:for-each select="relation">
					<xsl:variable name="tablename">
						<xsl:value-of select="@table"/>
					</xsl:variable>
					<xsl:text>dbOBJECT.</xsl:text>
					<xsl:value-of select="../../@name"/>
					<xsl:text>.</xsl:text>
					<xsl:value-of select="../@name"/>
					<xsl:text>.requires=IS_IN_DB( dbOBJECT, '</xsl:text>
					<xsl:value-of select="@table"/>
					<xsl:text>.id', '</xsl:text>
					<!-- hardcoded as this is expected from web2py every table to have anyway :) -->
					<xsl:for-each select="//table">
						<!-- have to do this way to find our table->row->names-->
						<xsl:if test="@name = $tablename">
							<xsl:for-each select="row">
								<xsl:if test="not(@name = 'id') and not(datatype = 'password')">
									<!-- do not show password and id fields by default in select box -->
									<xsl:text> %(</xsl:text>
									<xsl:value-of select="@name"/>
									<xsl:text>)s</xsl:text>
								</xsl:if>
							</xsl:for-each>
						</xsl:if>
					</xsl:for-each>
					<xsl:text>')&#xa;</xsl:text>
				</xsl:for-each>
			</xsl:for-each>
		</xsl:for-each>
	</xsl:template>
</xsl:stylesheet>
